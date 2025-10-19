import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal, TouchableWithoutFeedback } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function TimePicker({ 
  value, 
  onTimeChange, 
  label = "Time",
  style,
  labelStyle 
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempTime, setTempTime] = useState(null);

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleTimeChange = (event, date) => {
    if (Platform.OS === 'ios') {
      if (date) setTempTime(date);
    } else {
      setShowPicker(false);
      if (date) onTimeChange(date);
    }
  };

  const openPicker = () => {
    setTempTime(value || new Date());
    setShowPicker(true);
  };

  const confirmTime = () => {
    onTimeChange(tempTime);
    setShowPicker(false);
  };

  const cancelTime = () => {
    setShowPicker(false);
    setTempTime(null);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      
      <TouchableOpacity
        style={styles.timeButton}
        onPress={openPicker}
      >
        <Feather name="clock" size={20} color="#3A4D39" style={styles.clockIcon} />
        <Text style={styles.timeText}>
          {formatTime(value)}
        </Text>
      </TouchableOpacity>

      {/* iOS Modal */}
      {Platform.OS === 'ios' && showPicker && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={showPicker}
          onRequestClose={cancelTime}
        >
          <TouchableWithoutFeedback onPress={cancelTime}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <DateTimePicker
                    value={tempTime || new Date()}
                    mode="time"
                    is24Hour={false}
                    display="spinner"
                    onChange={handleTimeChange}
                    style={styles.picker}
                  />
                  <View style={styles.modalActions}>
                    <TouchableOpacity onPress={cancelTime} style={styles.cancelButton}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={confirmTime} style={styles.confirmButton}>
                      <Text style={styles.confirmText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* Android Default Picker */}
      {Platform.OS !== 'ios' && showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleTimeChange}
          style={styles.picker}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
    alignSelf: 'stretch',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3A4D39',
    marginBottom: 15,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    width: '100%',
    alignSelf: 'stretch',
  },
  clockIcon: {
    marginRight: 12,
  },
  timeText: {
    fontSize: 17,
    color: '#3A4D39',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    minWidth: 300,
  },
  picker: {
    backgroundColor: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelButton: {
    marginRight: 16,
  },
  cancelText: {
    color: '#888',
    fontSize: 16,
  },
  confirmButton: {
    // No additional styling needed
  },
  confirmText: {
    color: '#D36B37',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
