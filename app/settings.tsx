
import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSettings } from '../hooks/useSettings';
import { useTheme } from '../hooks/useTheme';
import { SUPPORTED_LANGUAGES } from '../types/settings';
import { scryfallService } from '../services/scryfallService';
import { useTranslations } from '../utils/localization';
import Icon from '../components/Icon';

export default function SettingsScreen() {
  const { settings, loading, updateSettings } = useSettings();
  const { colors, styles } = useTheme();
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<{ fileCount: number; totalSize: number } | null>(null);
  
  // Always call useTranslations, but provide a fallback
  const t = useTranslations(settings?.language || 'en');

  useEffect(() => {
    const loadCacheInfo = async () => {
      try {
        const info = await scryfallService.getCacheSize();
        setCacheInfo(info);
      } catch (error) {
        console.log('Error loading cache info:', error);
      }
    };
    loadCacheInfo();
  }, [clearingCache]);

  const handleLanguageChange = async (languageCode: 'en' | 'de' | 'fr' | 'it' | 'es') => {
    console.log('Changing language to:', languageCode);
    try {
      await updateSettings({ language: languageCode });
    } catch (error) {
      console.log('Error updating language:', error);
    }
  };

  const handleDarkModeToggle = async (value: boolean) => {
    console.log('Toggling dark mode:', value);
    try {
      await updateSettings({ darkMode: value });
    } catch (error) {
      console.log('Error updating dark mode setting:', error);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      t.clearCache,
      t.confirmClearCache,
      [
        {
          text: t.cancel,
          style: 'cancel',
        },
        {
          text: t.clear,
          style: 'destructive',
          onPress: async () => {
            setClearingCache(true);
            try {
              await scryfallService.clearImageCache();
              Alert.alert(t.success, t.cacheCleared);
              console.log('Cache cleared successfully');
            } catch (error) {
              console.log('Error clearing cache:', error);
              Alert.alert(t.error, t.failedToClear);
            } finally {
              setClearingCache(false);
            }
          },
        },
      ]
    );
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading || !settings) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.text}>{t.loadingSettings}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.section, { paddingTop: 20 }]}>
        <View style={styles.row}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: 16 }}
          >
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t.settings}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {/* Appearance */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <Text style={[styles.subtitle, { marginBottom: 16 }]}>{t.appearance}</Text>
          
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.subtitle, { marginBottom: 4 }]}>
                {t.darkMode}
              </Text>
              <Text style={[styles.textSecondary, { fontSize: 14 }]}>
                {t.switchTheme}
              </Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
              thumbColor={settings.darkMode ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>

        {/* Language Selection */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <Text style={[styles.subtitle, { marginBottom: 16 }]}>{t.language}</Text>
          
          {SUPPORTED_LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.row,
                {
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  marginBottom: 8,
                  backgroundColor: settings.language === lang.code ? colors.primary + '20' : colors.cardBackground,
                  borderRadius: 8,
                  borderWidth: settings.language === lang.code ? 2 : 1,
                  borderColor: settings.language === lang.code ? colors.primary : colors.border,
                }
              ]}
              onPress={() => handleLanguageChange(lang.code)}
            >
              <Text style={[
                styles.text,
                { 
                  flex: 1,
                  color: settings.language === lang.code ? colors.primary : colors.text 
                }
              ]}>
                {lang.name}
              </Text>
              {settings.language === lang.code && (
                <Icon name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Cache Management */}
        <View style={[styles.card, { marginBottom: 20 }]}>
          <Text style={[styles.subtitle, { marginBottom: 16 }]}>{t.cacheManagement}</Text>
          
          {cacheInfo && (
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.textSecondary, { fontSize: 14, marginBottom: 4 }]}>
                {t.cachedImages}: {cacheInfo.fileCount} {t.files}
              </Text>
              <Text style={[styles.textSecondary, { fontSize: 14 }]}>
                {t.cacheSize}: {formatBytes(cacheInfo.totalSize)}
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: colors.error,
                opacity: clearingCache ? 0.6 : 1,
              }
            ]}
            onPress={handleClearCache}
            disabled={clearingCache}
          >
            <View style={styles.row}>
              <Icon 
                name={clearingCache ? "hourglass-outline" : "trash-outline"} 
                size={16} 
                color={colors.background} 
                style={{ marginRight: 8 }} 
              />
              <Text style={styles.buttonText}>
                {clearingCache ? t.clearing : t.clearCache}
              </Text>
            </View>
          </TouchableOpacity>
          
          <Text style={[styles.textSecondary, { fontSize: 12, marginTop: 8, textAlign: 'center' }]}>
            {t.deleteAllImages}
          </Text>
        </View>

        {/* Info Section */}
        <View style={[styles.card, { backgroundColor: colors.info + '20', borderColor: colors.info }]}>
          <View style={styles.row}>
            <Icon name="information-circle" size={20} color={colors.info} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.text, { fontSize: 14, lineHeight: 20 }]}>
                Card and deck names will always remain in English to ensure compatibility with the Scryfall database.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
