import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import AIInsights from '../../components/ui/AIInsights';
import TalkToSomeone from '../../components/ui/TalkToSomeone';

export default function ReflectionsFeedScreen({ navigation }) {
  const [digest, setDigest] = useState(null);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TalkToSomeone
          context={{
            mood: digest?.theme?.toLowerCase(),
            theme: digest?.theme,
            reflectionText: digest?.summary
          }}
          navigation={navigation}
        />
        
        <AIInsights
          onDigestGenerated={(digest) => {
            console.log('AI insights generated:', digest);
            setDigest(digest);
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EBE4',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    flexGrow: 1,
  },
});
