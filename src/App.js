import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image
} from 'react-native';
import axios from 'axios';

// --- ANA UYGULAMA ---
const App = () => {
  const [screen, setScreen] = useState('home'); // home, camera, result
  const [ip, setIp] = useState('192.168.1.127'); // SENİN DOĞRU IP ADRESİN
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // --- 1. EKRAN: ANA SAYFA ---
  const renderHomeScreen = () => (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Text style={styles.icon}>🔬</Text>
        <Text style={styles.title}>LFA AI</Text>
        <Text style={styles.subtitle}>Mobil Tanı Sistemi</Text>
        
        {/* IP Ayarı */}
        <View style={styles.inputContainer}>
          <Text style={{color: '#aaa', marginBottom: 5}}>Sunucu IP Adresi:</Text>
          <TextInput 
            style={styles.input}
            value={ip}
            onChangeText={setIp}
            keyboardType="numeric"
            placeholder="192.168.1.x"
            placeholderTextColor="#666"
          />
        </View>

        <TouchableOpacity 
          style={styles.btnPrimary}
          onPress={() => testConnection()}
        >
          <Text style={styles.btnText}>BAĞLANTIYI TEST ET</Text>
        </TouchableOpacity>

        {/* Not: Kamera kütüphanesi yüklü olup olmadığını bilmediğim için
            şimdilik sadece bağlantı testi ve manuel giriş yapıyoruz. */}
        <Text style={styles.version}>v1.0.0 • Mobile Native</Text>
      </View>
    </View>
  );

  // --- BAĞLANTI TESTİ FONKSİYONU ---
  const testConnection = async () => {
    setLoading(true);
    try {
      // Sadece sunucuya ulaşabiliyor muyuz diye bakıyoruz
      const url = `http://${ip}:8000/`; 
      console.log("İstek atılıyor: " + url);
      
      const response = await axios.get(url, { timeout: 5000 });
      
      Alert.alert("BAŞARILI! ✅", "Sunucuya başarıyla bağlanıldı.\nCevap: " + JSON.stringify(response.data));
      // Bağlantı varsa diğer işlemlere geçebiliriz
    } catch (error) {
      console.log(error);
      Alert.alert("HATA ❌", `Sunucuya ulaşılamadı.\nIP: ${ip}\nHata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- UYGULAMA GÖVDE ---
  return (
    <SafeAreaView style={styles.mainContainer}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00ff00" />
          <Text style={{color:'white', marginTop:10}}>Sunucuyla konuşuluyor...</Text>
        </View>
      )}
      
      {screen === 'home' && renderHomeScreen()}
    </SafeAreaView>
  );
};

// --- STİLLER (CSS Yerine) ---
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    width: '100%',
  },
  icon: {
    fontSize: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#222',
    borderRadius: 10,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    fontSize: 18,
    padding: 15,
    borderRadius: 8,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#444'
  },
  btnPrimary: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  version: {
    marginTop: 50,
    color: '#444',
    fontSize: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999
  }
});

export default App;