import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

export default function AvatarSelector({ 
  gender, 
  size = 120, 
  style 
}) {
  // Avatar selection logic
  let avatarSource = require('../../assets/images/avatar-default.png');
  if (gender === 'female') {
    avatarSource = require('../../assets/images/avatar-girl.png');
  } else if (gender === 'male') {
    avatarSource = require('../../assets/images/avatar-boy.png');
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        source={avatarSource}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#F5EBE4',
  },
});
