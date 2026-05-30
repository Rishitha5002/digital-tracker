import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { expenseService } from '../api/expenseService';

const CATEGORIES = [
  { id: 'fuel', label: 'Fuel', icon: 'flame', color: '#EF4444' },
  { id: 'food', label: 'Food', icon: 'restaurant', color: '#F59E0B' },
  { id: 'toll', label: 'Toll', icon: 'car', color: '#4F46E5' },
  { id: 'parking', label: 'Parking', icon: 'business', color: '#8B5CF6' },
  { id: 'other', label: 'Other', icon: 'wallet', color: '#6B7280' },
];

const AddExpenseScreen = ({ navigation, route }) => {
  const tripId = route?.params?.tripId || null;
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [receiptNote, setReceiptNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Enter a valid amount';
    }
    if (!category) newErrors.category = 'Select a category';
    if (!description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await expenseService.addExpense({
        tripId,
        amount: parseFloat(amount),
        category,
        description: description.trim(),
        receiptNote: receiptNote.trim()
      });
      Alert.alert('✅ Expense Added!', 'Your expense has been submitted for approval.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to add expense. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Expense</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Amount */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 Amount</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          {errors.amount && (
            <Text style={styles.errorText}>{errors.amount}</Text>
          )}
        </View>

        {/* Category */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏷️ Category</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryBtn,
                  category === cat.id && {
                    backgroundColor: cat.color,
                    borderColor: cat.color
                  }
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <Ionicons
                  name={cat.icon}
                  size={22}
                  color={category === cat.id ? '#FFFFFF' : cat.color}
                />
                <Text style={[
                  styles.categoryLabel,
                  { color: category === cat.id ? '#FFFFFF' : '#1F2937' }
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.category && (
            <Text style={styles.errorText}>{errors.category}</Text>
          )}
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 Description</Text>
          <TextInput
            style={[styles.input, errors.description && styles.inputError]}
            placeholder="What was this expense for?"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholderTextColor="#9CA3AF"
          />
          {errors.description && (
            <Text style={styles.errorText}>{errors.description}</Text>
          )}
        </View>

        {/* Receipt Note */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧾 Receipt Note (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Any additional notes about receipt..."
            value={receiptNote}
            onChangeText={setReceiptNote}
            multiline
            numberOfLines={2}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, isLoading && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
              <Text style={styles.submitText}>Submit Expense</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
    paddingBottom: 8,
  },
  currency: { fontSize: 32, fontWeight: 'bold', color: '#4F46E5', marginRight: 8 },
  amountInput: {
    flex: 1, fontSize: 36, fontWeight: 'bold', color: '#1F2937',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 6,
  },
  categoryLabel: { fontSize: 14, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
    textAlignVertical: 'top',
    backgroundColor: '#F9FAFB',
  },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 6 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  disabledBtn: { opacity: 0.5 },
});

export default AddExpenseScreen;