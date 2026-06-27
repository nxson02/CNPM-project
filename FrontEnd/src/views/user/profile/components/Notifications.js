import {
  Badge,
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Spinner,
  Text,
  Tooltip,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { MdDeleteOutline, MdDoneAll, MdNotificationsNone } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import Card from 'components/card/Card.js';
import useNotifications from 'services/useNotifications';

const formatDate = (value) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value));

const resolveNotificationPath = (path) => {
  if (!path) return null;
  if (path.includes('/bills/') || path.includes('apartment-detail')) return '/user/payment';
  return path;
};

export default function Notifications(props) {
  const { ...rest } = props;
  const navigate = useNavigate();
  const toast = useToast();
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.300');
  const unreadBg = useColorModeValue('blue.50', 'whiteAlpha.100');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const {
    allNotifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({ pollInterval: 60000 });

  const handleOpen = async (notification) => {
    try {
      if (!notification.read) await markAsRead(notification.id);
      const target = resolveNotificationPath(notification.linkAPI);
      if (target) navigate(target);
    } catch (requestError) {
      toast({ title: 'Không thể cập nhật thông báo', status: 'error', duration: 2500 });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
    } catch (requestError) {
      toast({ title: 'Không thể xóa thông báo', status: 'error', duration: 2500 });
    }
  };

  return (
    <Card w="100%" p={{ base: '18px', md: '24px' }} {...rest}>
      <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap="12px" mb="18px">
        <Box>
          <Flex align="center" gap="8px">
            <Icon as={MdNotificationsNone} boxSize="22px" color="blue.500" />
            <Text color={textColor} fontWeight="700" fontSize="xl">Thông báo của bạn</Text>
            {unreadCount > 0 && <Badge colorScheme="red">{unreadCount} mới</Badge>}
          </Flex>
          <Text color={mutedColor} fontSize="sm" mt="4px">Cập nhật từ ban quản lý và hóa đơn căn hộ.</Text>
        </Box>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<MdDoneAll />}
          isDisabled={unreadCount === 0}
          onClick={markAllAsRead}
        >
          Đánh dấu đã đọc
        </Button>
      </Flex>

      {isLoading && <Flex justify="center" py="36px"><Spinner color="blue.500" /></Flex>}
      {!isLoading && error && <Text color="red.500" py="20px">{error}</Text>}
      {!isLoading && !error && allNotifications.length === 0 && (
        <Flex direction="column" align="center" py="40px" color={mutedColor}>
          <Icon as={MdNotificationsNone} boxSize="36px" mb="8px" />
          <Text>Chưa có thông báo nào.</Text>
        </Flex>
      )}

      <Flex direction="column" gap="8px" maxH="480px" overflowY="auto">
        {allNotifications.map((notification) => (
          <Flex
            key={notification.id}
            align="center"
            gap="12px"
            p="14px"
            bg={notification.read ? 'transparent' : unreadBg}
            border="1px solid"
            borderColor={notification.read ? borderColor : 'blue.200'}
            borderRadius="8px"
            cursor="pointer"
            onClick={() => handleOpen(notification)}
          >
            <Box w="8px" h="8px" flex="0 0 auto" borderRadius="full" bg={notification.read ? 'gray.300' : 'blue.500'} />
            <Box flex="1" minW="0">
              <Text color={textColor} fontSize="sm" fontWeight={notification.read ? '500' : '700'}>
                {notification.message}
              </Text>
              <Text color={mutedColor} fontSize="xs" mt="4px">{formatDate(notification.createdAt)}</Text>
            </Box>
            <Tooltip label="Xóa thông báo">
              <IconButton
                aria-label="Xóa thông báo"
                icon={<MdDeleteOutline />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDelete(notification.id);
                }}
              />
            </Tooltip>
          </Flex>
        ))}
      </Flex>
    </Card>
  );
}
