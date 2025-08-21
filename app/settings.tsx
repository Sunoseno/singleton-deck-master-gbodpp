
import React from 'react';
import { Text, View, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { router } from 'expo-router';
import { commonStyles, colors } from '../styles/commonStyles';
import { useSettings } from '../hooks/useSettings';
import { SUPPORTED_LANGUAGES } from '../types/settings';
import Icon from '../components/Icon';

export default function SettingsScreen() {
  const { settings, loading, updateSettings } = useSettings();

  if (loading || !settings) {
    return (
      <View style={[commonStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={commonStyles.text}>Loading settings...</Text>
      </View>
    );
  }

  const handleLanguageChange = async (languageCode: 'en' | 'de' | 'fr' | 'it' | 'es') => {
    console.log('Changing language to:', languageCode);
    try {
      await updateSettings({ language: languageCode });
    } catch (error) {
      console.log('Error updating language:', error);
    }
  };

  const handleTranslateToggle = async (value: boolean) => {
    console.log('Toggling card name translation:', value);
    try {
      await updateSettings({ translateCardNames: value });
    } catch (error) {
      console.log('Error updating translation setting:', error);
    }
  };

  return (
    <View style={commonStyles.container}>
      {/* Header */}
      <View style={[commonStyles.section, { paddingTop: 20 }]}>
        <View style={commonStyles.row}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: 16 }}
          >
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={commonStyles.title}>Settings</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
        {/* Language Selection */}
        <View style={[commonStyles.card, { marginBottom: 20 }]}>
          <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>Language</Text>
          
          {SUPPORTED_LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                commonStyles.row,
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
                commonStyles.text,
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

        {/* Card Name Translation */}
        <View style={[commonStyles.card, { marginBottom: 20 }]}>
          <View style={commonStyles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[commonStyles.subtitle, { marginBottom: 4 }]}>
                Translate Card Names
              </Text>
              <Text style={[commonStyles.textSecondary, { fontSize: 14 }]}>
                Show card names in selected language instead of English
              </Text>
            </View>
            <Switch
              value={settings.translateCardNames}
              onValueChange={handleTranslateToggle}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
              thumbColor={settings.translateCardNames ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>

        {/* Info Section */}
        <View style={[commonStyles.card, { backgroundColor: colors.info + '20', borderColor: colors.info }]}>
          <View style={commonStyles.row}>
            <Icon name="information-circle" size={20} color={colors.info} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[commonStyles.text, { fontSize: 14, lineHeight: 20 }]}>
                When card name translation is enabled, the app will fetch localized card names from the Scryfall API. 
                This may take longer to load and requires an internet connection.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
