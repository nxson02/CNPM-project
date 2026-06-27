import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  MdApartment,
  MdArrowForward,
  MdCalendarMonth,
  MdNotificationsNone,
  MdOutlinePayments,
  MdReceiptLong,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import Card from 'components/card/Card';
import api from 'services/apiConfig';
import useNotifications from 'services/useNotifications';

const communityEvents = [
  { date: '25/06', title: 'Họp cư dân định kỳ', place: 'Sảnh sinh hoạt cộng đồng' },
  { date: '29/06', title: 'Bảo trì hệ thống thang máy', place: 'Tòa BlueMoon' },
  { date: '06/07', title: 'Ngày hội gia đình BlueMoon', place: 'Khuôn viên tầng 1' },
];

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const resolveNotificationPath = (path) => {
  if (!path) return null;
  if (path.includes('/bills/') || path.includes('apartment-detail')) return '/user/payment';
  return path;
};

function MetricCard({ icon, label, value, helper, color }) {
  const muted = useColorModeValue('gray.600', 'gray.300');
  return (
    <Card p="18px" minH="116px">
      <Flex align="center" gap="14px">
        <Flex w="44px" h="44px" borderRadius="8px" align="center" justify="center" bg={`${color}.50`}>
          <Icon as={icon} boxSize="24px" color={`${color}.500`} />
        </Flex>
        <Box minW="0">
          <Text fontSize="sm" color={muted}>{label}</Text>
          <Text fontSize="xl" fontWeight="700" mt="2px" noOfLines={1}>{value}</Text>
          <Text fontSize="xs" color={muted} mt="2px">{helper}</Text>
        </Box>
      </Flex>
    </Card>
  );
}

export default function UserHomePage() {
  const navigate = useNavigate();
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const muted = useColorModeValue('gray.600', 'gray.300');
  const softBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const [resident, setResident] = useState(null);
  const [apartments, setApartments] = useState([]);
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { allNotifications, unreadCount, markAsRead } = useNotifications({ pollInterval: 60000 });

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const homeResponse = await api.get('/user/home');
      const residentData = homeResponse.data.resident;
      const apartmentNumbers = Array.from(residentData?.apartmentNumbers || []);
      const details = await Promise.all(
        apartmentNumbers.map((number) =>
          api.get('/user/apartment-detail', { params: { apartmentNumber: number } })
        )
      );

      setResident(residentData);
      setApartments(details.map((response) => response.data.apartment).filter(Boolean));
      setBills(details.flatMap((response) => Array.from(response.data.bills || [])));
      setError('');
    } catch (requestError) {
      setError('Không thể tải dữ liệu trang chủ. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const unpaidBills = useMemo(() => bills.filter((bill) => bill.status !== 'PAID'), [bills]);
  const amountDue = useMemo(
    () => unpaidBills.reduce((total, bill) => total + (Number(bill.amount) || 0), 0),
    [unpaidBills]
  );
  const upcomingBills = useMemo(
    () => [...unpaidBills]
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 4),
    [unpaidBills]
  );

  const openNotification = async (notification) => {
    if (!notification.read) await markAsRead(notification.id);
    const target = resolveNotificationPath(notification.linkAPI);
    if (target) navigate(target);
  };

  return (
    <Box pt={{ base: '130px', md: '92px', xl: '92px' }} pb="24px">
      <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap="16px" mb="22px">
        <Box>
          <Text color={muted} fontSize="sm">Tổng quan hôm nay</Text>
          <Text color={textColor} fontSize={{ base: '2xl', md: '3xl' }} fontWeight="700">
            Xin chào, {resident?.fullName || 'cư dân BlueMoon'}
          </Text>
          <Text color={muted} mt="4px">Theo dõi căn hộ, hóa đơn và các cập nhật mới nhất.</Text>
        </Box>
        <Button rightIcon={<MdArrowForward />} colorScheme="blue" onClick={() => navigate('/user/payment')}>
          Xem hóa đơn
        </Button>
      </Flex>

      {error && <Box mb="18px" p="14px" borderRadius="8px" bg="red.50" color="red.600">{error}</Box>}

      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing="16px" mb="20px">
        {isLoading ? [...Array(4)].map((_, index) => <Skeleton key={index} h="116px" borderRadius="8px" />) : (
          <>
            <MetricCard icon={MdApartment} label="Căn hộ" value={apartments.length} helper="Đang liên kết với tài khoản" color="blue" />
            <MetricCard icon={MdReceiptLong} label="Hóa đơn chưa trả" value={unpaidBills.length} helper={`${bills.length} hóa đơn tổng cộng`} color="orange" />
            <MetricCard icon={MdOutlinePayments} label="Số tiền cần thanh toán" value={currency.format(amountDue)} helper="Không bao gồm hóa đơn đã trả" color="green" />
            <MetricCard icon={MdNotificationsNone} label="Thông báo mới" value={unreadCount} helper={`${allNotifications.length} thông báo tổng cộng`} color="red" />
          </>
        )}
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 1.45fr) minmax(320px, 0.8fr)' }} gap="20px">
        <GridItem>
          <Card p={{ base: '18px', md: '22px' }} mb="20px">
            <Flex justify="space-between" align="center" mb="16px">
              <Box>
                <Text color={textColor} fontSize="lg" fontWeight="700">Hóa đơn cần chú ý</Text>
                <Text color={muted} fontSize="sm">Sắp xếp theo hạn thanh toán gần nhất.</Text>
              </Box>
              <Button variant="ghost" size="sm" rightIcon={<MdArrowForward />} onClick={() => navigate('/user/payment')}>Xem tất cả</Button>
            </Flex>
            {isLoading && <Skeleton h="180px" borderRadius="8px" />}
            {!isLoading && upcomingBills.length === 0 && <Text color={muted} py="36px" textAlign="center">Bạn không có hóa đơn chưa thanh toán.</Text>}
            <Flex direction="column" gap="8px">
              {upcomingBills.map((bill) => {
                const overdue = bill.dueDate && new Date(bill.dueDate) < new Date();
                return (
                  <Flex key={bill.id} align="center" justify="space-between" gap="12px" p="13px" bg={softBg} borderRadius="8px">
                    <Box minW="0">
                      <Flex align="center" gap="8px">
                        <Text color={textColor} fontWeight="700" noOfLines={1}>{bill.description || bill.billType}</Text>
                        <Badge colorScheme={overdue ? 'red' : 'orange'}>{overdue ? 'Quá hạn' : 'Chưa thanh toán'}</Badge>
                      </Flex>
                      <Text color={muted} fontSize="xs" mt="4px">Căn hộ {bill.apartmentNumber || 'của bạn'} · Hạn {bill.dueDate ? dateFormatter.format(new Date(bill.dueDate)) : 'chưa cập nhật'}</Text>
                    </Box>
                    <Text color={textColor} fontWeight="700" whiteSpace="nowrap">{currency.format(Number(bill.amount) || 0)}</Text>
                  </Flex>
                );
              })}
            </Flex>
          </Card>

          <Card p={{ base: '18px', md: '22px' }}>
            <Flex align="center" gap="8px" mb="16px">
              <Icon as={MdApartment} color="blue.500" boxSize="22px" />
              <Text color={textColor} fontSize="lg" fontWeight="700">Căn hộ của tôi</Text>
            </Flex>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing="10px">
              {apartments.map((apartment) => (
                <Box key={apartment.id} p="14px" border="1px solid" borderColor={borderColor} borderRadius="8px">
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="700">Căn {apartment.apartmentNumber}</Text>
                    <Badge colorScheme={apartment.status === 'OCCUPIED' ? 'green' : 'gray'}>{apartment.status || 'Đang sử dụng'}</Badge>
                  </Flex>
                  <Text color={muted} fontSize="sm" mt="6px">Tầng {apartment.floor} · {apartment.area} m²</Text>
                </Box>
              ))}
            </SimpleGrid>
          </Card>
        </GridItem>

        <GridItem>
          <Card p={{ base: '18px', md: '22px' }} mb="20px">
            <Flex justify="space-between" align="center" mb="14px">
              <Flex align="center" gap="8px">
                <Icon as={MdNotificationsNone} color="red.500" boxSize="22px" />
                <Text color={textColor} fontSize="lg" fontWeight="700">Thông báo gần đây</Text>
              </Flex>
              {unreadCount > 0 && <Badge colorScheme="red">{unreadCount} mới</Badge>}
            </Flex>
            <Flex direction="column" gap="8px">
              {allNotifications.slice(0, 5).map((notification) => (
                <Box
                  key={notification.id}
                  p="12px"
                  borderLeft="3px solid"
                  borderColor={notification.read ? 'gray.300' : 'blue.500'}
                  bg={softBg}
                  cursor="pointer"
                  onClick={() => openNotification(notification)}
                >
                  <Text fontSize="sm" fontWeight={notification.read ? '500' : '700'} noOfLines={2}>{notification.message}</Text>
                  <Text fontSize="xs" color={muted} mt="5px">{new Date(notification.createdAt).toLocaleString('vi-VN')}</Text>
                </Box>
              ))}
              {allNotifications.length === 0 && <Text color={muted} py="28px" textAlign="center">Chưa có thông báo mới.</Text>}
            </Flex>
            <Button w="100%" mt="14px" variant="outline" onClick={() => navigate('/user/profile-user')}>Mở trung tâm thông báo</Button>
          </Card>

          <Card p={{ base: '18px', md: '22px' }}>
            <Flex align="center" gap="8px" mb="14px">
              <Icon as={MdCalendarMonth} color="green.500" boxSize="22px" />
              <Text color={textColor} fontSize="lg" fontWeight="700">Lịch cộng đồng</Text>
            </Flex>
            <Flex direction="column" gap="10px">
              {communityEvents.map((event) => (
                <Flex key={`${event.date}-${event.title}`} gap="12px" align="center">
                  <Flex w="48px" h="42px" flex="0 0 auto" align="center" justify="center" bg="green.50" color="green.700" borderRadius="8px" fontWeight="700" fontSize="sm">
                    {event.date}
                  </Flex>
                  <Box>
                    <Text fontSize="sm" fontWeight="700">{event.title}</Text>
                    <Text color={muted} fontSize="xs">{event.place}</Text>
                  </Box>
                </Flex>
              ))}
            </Flex>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  );
}
