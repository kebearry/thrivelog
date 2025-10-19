import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';

export default function ModalDialog({ 
  visible, 
  onClose, 
  title, 
  children, 
  showCloseButton = true,
  closeButtonText = "Close",
  style,
  overlayStyle,
  titleStyle,
  closeButtonStyle,
  closeButtonTextStyle
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={[styles.overlay, overlayStyle]} onPress={onClose}>
        <View style={[styles.dialog, style]}>
          {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
          
          {children}
          
          {showCloseButton && (
            <TouchableOpacity 
              onPress={onClose} 
              style={[styles.closeButton, closeButtonStyle]} 
              accessibilityLabel="Close dialog"
            >
              <Text style={[styles.closeButtonText, closeButtonTextStyle]}>
                {closeButtonText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22372B',
    marginBottom: 10,
    fontFamily: 'serif',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginTop: 2,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F5EBE4',
  },
  closeButtonText: {
    color: '#d56c3e',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
