import React, { useState, useMemo, useCallback, useReducer, useContext, createContext } from 'react';
import { View, Text, FlatList, StyleSheet, StatusBar, useColorScheme, Modal, TouchableOpacity, Pressable, TextInput, Button, ScrollView, Alert } from 'react-native';

// ...existing code...

type Invoice = {
  id: string;
  customerName: string;
  productName: string;
  quantity: number;
  price: number;
  status: string;
};

const initialInvoices: Invoice[] = [
  {
    id: 'HD001',
    customerName: 'Nguyen Van A',
    productName: 'Sản phẩm 1',
    quantity: 2,
    price: 50000,
    status: 'Đã thanh toán',
  },
  {
    id: 'HD002',
    customerName: 'Tran Thi B',
    productName: 'Sản phẩm 2',
    quantity: 1,
    price: 120000,
    status: 'Chưa thanh toán',
  },
  {
    id: 'HD003',
    customerName: 'Hoang Van C',
    productName: 'Sản phẩm 3',
    quantity: 1,
    price: 10000,
    status: 'Chưa thanh toán',
  },
  {
    id: 'HD004',
    customerName: 'Le Thi D',
    productName: 'Sản phẩm 4',
    quantity: 3,
    price: 75000,
    status: 'Đã thanh toán',
  },
];


// Context và reducer
type InvoiceAction =
  | { type: 'ADD'; payload: Invoice }
  | { type: 'UPDATE'; payload: Invoice }
  | { type: 'DELETE'; payload: string }
  | { type: 'TOGGLE_STATUS'; payload: string };

type InvoiceContextType = {
  invoices: Invoice[];
  dispatch: React.Dispatch<InvoiceAction>;
};

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

function invoiceReducer(state: Invoice[], action: InvoiceAction): Invoice[] {
  switch (action.type) {
    case 'ADD':
      return [...state, action.payload];
    case 'UPDATE':
      return state.map(inv => inv.id === action.payload.id ? action.payload : inv);
    case 'DELETE':
      return state.filter(inv => inv.id !== action.payload);
    case 'TOGGLE_STATUS':
      return state.map(inv =>
        inv.id === action.payload
          ? { ...inv, status: inv.status === 'Đã thanh toán' ? 'Chưa thanh toán' : 'Đã thanh toán' }
          : inv
      );
    default:
      return state;
  }
}

function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const [invoices, dispatch] = useReducer(invoiceReducer, initialInvoices);
  return (
    <InvoiceContext.Provider value={{ invoices, dispatch }}>
      {children}
    </InvoiceContext.Provider>
  );
}

function useInvoices() {
  const context = useContext(InvoiceContext);
  if (!context) throw new Error('useInvoices must be used within InvoiceProvider');
  return context;
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const { invoices, dispatch } = useInvoices();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState<Invoice>({
    id: '',
    customerName: '',
    productName: '',
    quantity: 1,
    price: 0,
    status: 'Chưa thanh toán',
  });

  // Handler CRUD sử dụng useCallback
  const handleAddInvoice = useCallback(() => {
    setForm({ id: '', customerName: '', productName: '', quantity: 1, price: 0, status: 'Chưa thanh toán' });
    setIsEdit(false);
    setEditModalVisible(true);
  }, []);

  const handleEditInvoice = useCallback((invoice: Invoice) => {
    setForm(invoice);
    setIsEdit(true);
    setEditModalVisible(true);
  }, []);

  const handleSaveInvoice = useCallback(() => {
    if (!form.id || !form.customerName || !form.productName) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    if (isEdit) {
      dispatch({ type: 'UPDATE', payload: form });
    } else {
      if (invoices.some(inv => inv.id === form.id)) {
        Alert.alert('Lỗi', 'Mã hóa đơn đã tồn tại!');
        return;
      }
      dispatch({ type: 'ADD', payload: form });
    }
    setEditModalVisible(false);
  }, [form, isEdit, invoices, dispatch]);

  const handleDeleteInvoice = useCallback((id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa hóa đơn này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => dispatch({ type: 'DELETE', payload: id }) },
    ]);
  }, [dispatch]);

  const handleUpdateStatus = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_STATUS', payload: id });
    setSelectedInvoice(prev => prev ? { ...prev, status: prev.status === 'Đã thanh toán' ? 'Chưa thanh toán' : 'Đã thanh toán' } : null);
  }, [dispatch]);

  const handlePressInvoice = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setModalVisible(true);
  }, []);

  const renderItem = useCallback(({ item }: { item: Invoice }) => (
    <View style={styles.itemRow}>
      <TouchableOpacity onPress={() => handlePressInvoice(item)} style={{ flex: 1 }}>
        <Text style={[styles.itemCell, { color: '#007AFF', textDecorationLine: 'underline' }]}>{item.id}</Text>
      </TouchableOpacity>
      <Text style={styles.itemCell}>{item.customerName}</Text>
      <Text style={styles.itemCell}>{(item.quantity * item.price).toLocaleString()} đ</Text>
      <TouchableOpacity onPress={() => handleEditInvoice(item)}>
        <Text style={{ color: '#007AFF', marginHorizontal: 8 }}>Sửa</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDeleteInvoice(item.id)}>
        <Text style={{ color: 'red' }}>Xóa</Text>
      </TouchableOpacity>
    </View>
  ), [handlePressInvoice, handleEditInvoice, handleDeleteInvoice]);

  // Đếm số hóa đơn theo trạng thái (useMemo)
  const completedCount = useMemo(() => invoices.filter(inv => inv.status === 'Đã thanh toán').length, [invoices]);
  const uncompletedCount = useMemo(() => invoices.filter(inv => inv.status !== 'Đã thanh toán').length, [invoices]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Text style={styles.title}>Danh sách hóa đơn</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>Hoàn thành: {completedCount}</Text>
        <Text style={styles.summaryText}>Chưa hoàn thành: {uncompletedCount}</Text>
      </View>
      <Button title="Thêm hóa đơn" onPress={handleAddInvoice} />
      <View style={styles.headerRow}>
        <Text style={styles.headerCell}>Mã HĐ</Text>
        <Text style={styles.headerCell}>Khách hàng</Text>
        <Text style={styles.headerCell}>Tổng tiền</Text>
        <Text style={[styles.headerCell, { flex: 0.7 }]}>Sửa/Xóa</Text>
      </View>
      <FlatList
        data={invoices}
        keyExtractor={item => item.id}
        renderItem={renderItem}
      />

      {/* Modal chi tiết */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chi tiết hóa đơn</Text>
            {selectedInvoice && (
              <ScrollView>
                <Text style={styles.modalText}>Mã hóa đơn: {selectedInvoice.id}</Text>
                <Text style={styles.modalText}>Họ tên khách hàng: {selectedInvoice.customerName}</Text>
                <Text style={styles.modalText}>Tên sản phẩm: {selectedInvoice.productName}</Text>
                <Text style={styles.modalText}>Số lượng: {selectedInvoice.quantity}</Text>
                <Text style={styles.modalText}>Đơn giá: {selectedInvoice.price.toLocaleString()} đ</Text>
                <Text style={styles.modalText}>Tổng tiền: {(selectedInvoice.quantity * selectedInvoice.price).toLocaleString()} đ</Text>
                <Text style={styles.modalText}>Trạng thái: {selectedInvoice.status}</Text>
                <Button
                  title={selectedInvoice.status === 'Đã thanh toán' ? 'Chuyển sang Chưa thanh toán' : 'Chuyển sang Đã thanh toán'}
                  onPress={() => handleUpdateStatus(selectedInvoice.id)}
                />
              </ScrollView>
            )}
            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal thêm/sửa */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEdit ? 'Sửa hóa đơn' : 'Thêm hóa đơn'}</Text>
            <ScrollView>
              <Text style={styles.modalText}>Mã hóa đơn</Text>
              <TextInput
                style={styles.input}
                value={form.id}
                editable={!isEdit}
                onChangeText={text => setForm(f => ({ ...f, id: text }))}
                placeholder="Nhập mã hóa đơn"
              />
              <Text style={styles.modalText}>Họ tên khách hàng</Text>
              <TextInput
                style={styles.input}
                value={form.customerName}
                onChangeText={text => setForm(f => ({ ...f, customerName: text }))}
                placeholder="Nhập họ tên khách hàng"
              />
              <Text style={styles.modalText}>Tên sản phẩm</Text>
              <TextInput
                style={styles.input}
                value={form.productName}
                onChangeText={text => setForm(f => ({ ...f, productName: text }))}
                placeholder="Nhập tên sản phẩm"
              />
              <Text style={styles.modalText}>Số lượng</Text>
              <TextInput
                style={styles.input}
                value={form.quantity.toString()}
                onChangeText={text => setForm(f => ({ ...f, quantity: parseInt(text) || 1 }))}
                keyboardType="numeric"
              />
              <Text style={styles.modalText}>Đơn giá</Text>
              <TextInput
                style={styles.input}
                value={form.price.toString()}
                onChangeText={text => setForm(f => ({ ...f, price: parseInt(text) || 0 }))}
                keyboardType="numeric"
              />
              <Text style={styles.modalText}>Trạng thái</Text>
              <TextInput
                style={styles.input}
                value={form.status}
                onChangeText={text => setForm(f => ({ ...f, status: text }))}
                placeholder="Nhập trạng thái"
              />
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <Button title="Lưu" onPress={handleSaveInvoice} />
              <Button title="Hủy" color="gray" onPress={() => setEditModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 24,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 16,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemCell: {
    flex: 1,
    fontSize: 15,
  },
});
export default function MainApp() {
  return (
    <InvoiceProvider>
      <App />
    </InvoiceProvider>
  );
}

