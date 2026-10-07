import React, { useState, useEffect } from 'react';
import {
  SafeAreaView, View, Text, FlatList, TextInput,
  TouchableOpacity, Modal, StyleSheet, Alert
} from 'react-native';
import { db, initDatabase } from '../services/db';

export default function SQLitePOSScreen() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  // READ: loads all rows, or only rows matching the search text.
  const loadData = (query = '') => {
    if (query.trim() === '') {
      const allRows = db.getAllSync('SELECT * FROM products ORDER BY id DESC;');
      setProducts(allRows);
    } else {
      const filtered = db.getAllSync(
        'SELECT * FROM products WHERE name LIKE ? ORDER BY name ASC;',
        [`%${query.trim()}%`]
      );
      setProducts(filtered);
    }
  };

  // Runs once when the screen first appears.
  useEffect(() => {
    initDatabase();
    loadData();
  }, []);

  // CREATE
  const handleAddProduct = () => {
    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);

    if (!name.trim() || !price || !stock) {
      Alert.alert('Validation Error', 'Please fill in all product fields.');
      return;
    }
    if (isNaN(priceNum) || isNaN(stockNum) || priceNum < 0 || stockNum < 0) {
      Alert.alert('Validation Error', 'Price and stock must be valid numbers.');
      return;
    }

    db.runSync(
      'INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?);',
      [name.trim(), category.trim() || 'General', priceNum, stockNum]
    );

    setName(''); setCategory(''); setPrice(''); setStock('');
    setModalVisible(false);
    loadData(search);
  };

  // DELETE (with confirmation)
  const handleDelete = (id, prodName) => {
    Alert.alert('Delete Confirmation', `Remove ${prodName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          db.runSync('DELETE FROM products WHERE id = ?;', [id]);
          loadData(search);
        },
      },
    ]);
  };

  // UPDATE (bonus): change stock by +1 or -1, never below 0.
  const changeStock = (id, delta) => {
    db.runSync('UPDATE products SET stock = MAX(stock + ?, 0) WHERE id = ?;', [delta, id]);
    loadData(search);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Inventory Database (SQLite)</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchBar}
        placeholder="Search items by name (SQL LIKE)..."
        value={search}
        onChangeText={(text) => { setSearch(text); loadData(text); }}
      />

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>
                Cat: {item.category} • Stock: {item.stock} units
              </Text>
            </View>
            <Text style={styles.itemPrice}>₱{item.price.toFixed(2)}</Text>

            <TouchableOpacity onPress={() => changeStock(item.id, -1)} style={styles.stockBtn}>
              <Text style={styles.stockBtnText}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => changeStock(item.id, 1)} style={styles.stockBtn}>
              <Text style={styles.stockBtnText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.delBtn}>
              <Text style={styles.delBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No products found in SQLite database.</Text>
        }
      />

      {/* Modal for adding a product */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Product Entry</Text>
            <TextInput style={styles.input} placeholder="Product Name" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Category (e.g. Produce)" value={category} onChangeText={setCategory} />
            <TextInput style={styles.input} placeholder="Price (PHP)" keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
            <TextInput style={styles.input} placeholder="Initial Stock" keyboardType="number-pad" value={stock} onChangeText={setStock} />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddProduct}>
                <Text style={[styles.btnText, { color: '#FFF' }]}>Save to SQLite</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0E2A35' },
  addBtn: { backgroundColor: '#00758F', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6 },
  addBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  searchBar: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, marginBottom: 12 },
  card: { flexDirection: 'row', backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  itemName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  itemMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: 'bold', color: '#00758F', marginHorizontal: 8 },
  stockBtn: { backgroundColor: '#E0F2FE', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 4, marginRight: 4 },
  stockBtnText: { color: '#00758F', fontWeight: 'bold', fontSize: 14 },
  delBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 4 },
  delBtnText: { color: '#DC2626', fontWeight: 'bold', fontSize: 13 },
  empty: { textAlign: 'center', color: '#64748B', marginTop: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0E2A35', marginBottom: 14 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, padding: 10, marginBottom: 10 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { padding: 10 },
  saveBtn: { backgroundColor: '#00758F', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6 },
  btnText: { fontWeight: 'bold', color: '#64748B' },
});