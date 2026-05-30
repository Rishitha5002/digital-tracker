import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const FAQ_DATA = [
  {
    question: 'How do I start a trip?',
    answer: 'Go to the Start tab in the bottom navigation, allow location permissions, and tap "Start Trip". Your route will be tracked until you stop the trip.'
  },
  {
    question: 'How do I track expenses?',
    answer: 'Open a trip from History, then tap "Add Expense". Fill in the amount, category, and description. Your manager can approve expenses from the admin panel.'
  },
  {
    question: 'How do I reset my password?',
    answer: 'On the login screen, tap "Forgot Password" and enter your email. You will receive a Firebase password reset link in your inbox.'
  },
  {
    question: 'How do I change my role?',
    answer: 'Go to Profile and tap "Edit Role". Select employee or admin. Note: role changes affect which screens you can access.'
  },
  {
    question: 'How do I manage notifications?',
    answer: 'From Profile, open Notifications. Toggle trip alerts, system messages, and delivery preferences. Settings sync to your account.'
  }
];

const HelpSupportScreen = ({ navigation }) => {
  const handleEmailPress = () => {
    Linking.openURL('mailto:support@digitaltracker.com').catch(() => {
      Alert.alert('Error', 'Unable to open email client');
    });
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:+1234567890').catch(() => {
      Alert.alert('Error', 'Unable to make phone call');
    });
  };

  const handleFAQPress = (index) => {
    const faq = FAQ_DATA[index];
    Alert.alert(faq.question, faq.answer);
  };

  const FAQItem = ({ question, onPress }) => (
    <TouchableOpacity style={styles.faqItem} onPress={onPress}>
      <Text style={styles.faqQuestion}>{question}</Text>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const ContactOption = ({ icon, title, subtitle, onPress }) => (
    <TouchableOpacity style={styles.contactOption} onPress={onPress}>
      <View style={styles.contactIcon}>
        <Ionicons name={icon} size={24} color="#4F46E5" />
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactTitle}>{title}</Text>
        <Text style={styles.contactSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Help</Text>
          <View style={styles.helpCard}>
            <View style={styles.helpIcon}>
              <Ionicons name="headset-outline" size={32} color="#4F46E5" />
            </View>
            <Text style={styles.helpTitle}>Need Help?</Text>
            <Text style={styles.helpText}>
              Our support team is available to assist you with any questions or issues.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {FAQ_DATA.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              onPress={() => handleFAQPress(index)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <ContactOption
            icon="mail-outline"
            title="Email Support"
            subtitle="support@digitaltracker.com"
            onPress={handleEmailPress}
          />
          <ContactOption
            icon="call-outline"
            title="Phone Support"
            subtitle="+1 (234) 567-890"
            onPress={handlePhonePress}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Can&apos;t find what you&apos;re looking for?</Text>
          <TouchableOpacity style={styles.contactButton} onPress={handleEmailPress}>
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  placeholder: { width: 40 },
  scrollView: { flex: 1 },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  helpCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  helpIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  helpText: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  faqItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  faqQuestion: { fontSize: 15, color: '#1F2937', flex: 1 },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: { flex: 1 },
  contactTitle: { fontSize: 15, fontWeight: '500', color: '#1F2937', marginBottom: 2 },
  contactSubtitle: { fontSize: 13, color: '#6B7280' },
  footer: { padding: 24, alignItems: 'center' },
  footerText: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  contactButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});

export default HelpSupportScreen;
