import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Flex,
  Text,
  Box,
  Image,
  Input,
  Divider,
  Badge,
  Alert,
  AlertIcon,
  Spinner,
  VStack,
  HStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9090';

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatBillType = (value) => {
  if (!value) return '';
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const PaymentModal = ({ isOpen, onClose, id, refreshData }) => {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.300');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200');
  const qrBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const toast = useToast();
  const [bill, setBill] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPaymentInfo = async () => {
      if (!isOpen || !id) return;

      setIsLoading(true);
      setError('');
      setTransactionId('');

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/payments/bills/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setBill(response.data);
      } catch (err) {
        const message =
          err.response?.data?.message || 'Không tải được thông tin thanh toán.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentInfo();
  }, [id, isOpen]);

  const handleConfirmPayment = async () => {
    if (!id) return;

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/payments/process`,
        {
          billId: id,
          transactionId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      setBill(response.data);
      toast({
        title: 'Đã ghi nhận thanh toán',
        description: 'Hóa đơn đã được cập nhật thành đã thanh toán.',
        status: 'success',
        duration: 2500,
        isClosable: true,
      });

      if (refreshData) {
        refreshData();
      }

      onClose();
    } catch (err) {
      const message =
        err.response?.data?.message || 'Không thể xác nhận thanh toán lúc này.';
      setError(message);
      toast({
        title: 'Thanh toán thất bại',
        description: message,
        status: 'error',
        duration: 2500,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text fontSize="lg" fontWeight="700" color={textColor}>
            Payment
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isLoading ? (
            <Flex justify="center" align="center" minH="260px">
              <Spinner size="xl" color="green.500" />
            </Flex>
          ) : error ? (
            <Alert status="error" borderRadius="8px">
              <AlertIcon />
              {error}
            </Alert>
          ) : bill ? (
            <VStack align="stretch" spacing="16px">
              <HStack justify="space-between" align="start">
                <Box>
                  <Text color={mutedTextColor} fontSize="sm">
                    Hóa đơn #{bill.id}
                  </Text>
                  <Text color={textColor} fontSize="lg" fontWeight="700">
                    {formatBillType(bill.billType)}
                  </Text>
                </Box>
                <Badge
                  colorScheme={bill.status === 'PAID' ? 'green' : 'red'}
                  borderRadius="6px"
                  px="10px"
                  py="4px"
                >
                  {bill.status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </Badge>
              </HStack>

              <Divider borderColor={borderColor} />

              <Flex
                direction={{ base: 'column', md: 'row' }}
                gap="18px"
                align="center"
              >
                <Flex
                  bg={qrBg}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="8px"
                  p="12px"
                  minW="210px"
                  justify="center"
                >
                  {bill.qrCodeUrl ? (
                    <Image
                      src={bill.qrCodeUrl}
                      alt="QR thanh toán"
                      boxSize="190px"
                      objectFit="contain"
                    />
                  ) : (
                    <Text color={mutedTextColor}>Chưa có mã QR</Text>
                  )}
                </Flex>

                <VStack align="stretch" spacing="10px" flex="1" w="100%">
                  <Box>
                    <Text color={mutedTextColor} fontSize="sm">
                      Số tiền
                    </Text>
                    <Text color={textColor} fontSize="2xl" fontWeight="800">
                      {formatCurrency(bill.amount)}
                    </Text>
                  </Box>
                  <Box>
                    <Text color={mutedTextColor} fontSize="sm">
                      Nội dung chuyển khoản
                    </Text>
                    <Text color={textColor} fontSize="md" fontWeight="700">
                      {bill.paymentReferenceCode}
                    </Text>
                  </Box>
                  <Box>
                    <Text color={mutedTextColor} fontSize="sm">
                      Căn hộ
                    </Text>
                    <Text color={textColor} fontSize="md" fontWeight="700">
                      {bill.apartmentNumber}
                    </Text>
                  </Box>
                </VStack>
              </Flex>

              {bill.status !== 'PAID' && (
                <Box>
                  <Text color={mutedTextColor} fontSize="sm" mb="6px">
                    Mã giao dịch ngân hàng (nếu có)
                  </Text>
                  <Input
                    value={transactionId}
                    onChange={(event) => setTransactionId(event.target.value)}
                    placeholder="VD: FT123456789"
                  />
                </Box>
              )}
            </VStack>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="whiteBrand"
            color="dark"
            fontSize="sm"
            fontWeight="500"
            borderRadius="10px"
            px="15px"
            py="5px"
            onClick={onClose}
            mr="10px"
          >
            Đóng
          </Button>
          {bill?.status !== 'PAID' && !error && (
            <Button
              colorScheme="green"
              fontSize="sm"
              fontWeight="600"
              borderRadius="10px"
              px="15px"
              py="5px"
              isLoading={isSubmitting}
              isDisabled={isLoading || !bill}
              onClick={handleConfirmPayment}
            >
              Tôi đã thanh toán
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PaymentModal;
