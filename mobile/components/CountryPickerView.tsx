import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  Animated,
  Keyboard,
  Platform,
  Easing,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COUNTRIES, Country } from '../lib/countries';

const RED = '#E50914';
const ITEM_HEIGHT = 56;
const DIVIDER_HEIGHT = 1;
const TOTAL_ROW_HEIGHT = ITEM_HEIGHT + DIVIDER_HEIGHT;

interface CountryPickerViewProps {
  selectedCountry: Country;
  onSelect: (country: Country) => void;
  onBack: () => void;
}

interface CountryRowItemProps {
  item: Country;
  isSelected: boolean;
  onSelect: (country: Country) => void;
}

const CountryRowItem = React.memo<CountryRowItemProps>(
  ({ item, isSelected, onSelect }) => {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.countryRow,
          isSelected && styles.countryRowSelected,
          pressed && !isSelected && styles.countryRowPressed,
        ]}
        onPress={() => onSelect(item)}
      >
        <View style={styles.countryLeft}>
          <Text style={styles.countryFlag}>{item.flag}</Text>
          <Text
            style={[
              styles.countryName,
              isSelected && styles.countryNameSelected,
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
        </View>

        <View style={styles.countryRight}>
          <Text
            style={[
              styles.countryCallingCode,
              isSelected && styles.countryCallingCodeSelected,
            ]}
          >
            {item.callingCode}
          </Text>
          {isSelected && (
            <View style={styles.selectedCheckBadge}>
              <Text style={styles.selectedCheckText}>✓</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  },
  (prev, next) =>
    prev.isSelected === next.isSelected &&
    prev.item.code === next.item.code
);

export function CountryPickerView({
  selectedCountry,
  onSelect,
  onBack,
}: CountryPickerViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, slideAnim]);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 20,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onBack();
    });
  }, [opacityAnim, slideAnim, onBack]);

  const handleSelect = useCallback(
    (country: Country) => {
      Keyboard.dismiss();
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        onSelect(country);
      });
    },
    [opacityAnim, onSelect]
  );

  // Filter countries instantly
  const filteredCountries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.callingCode.includes(query) ||
        c.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const renderItem = useCallback(
    ({ item }: { item: Country }) => (
      <CountryRowItem
        item={item}
        isSelected={item.code === selectedCountry.code}
        onSelect={handleSelect}
      />
    ),
    [selectedCountry.code, handleSelect]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: TOTAL_ROW_HEIGHT,
      offset: TOTAL_ROW_HEIGHT * index,
      index,
    }),
    []
  );

  const keyExtractor = useCallback((item: Country) => item.code, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: opacityAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Top Header with Circular Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleClose}
            accessibilityLabel="Go back"
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <View
            style={[
              styles.searchBar,
              isSearchFocused && styles.searchBarFocused,
            ]}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by country name..."
              placeholderTextColor="#71717A"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.clearIcon}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Section Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Select your country</Text>
        </View>

        {/* Performant 60 FPS Country List */}
        <FlatList
          data={filteredCountries}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={18}
          maxToRenderPerBatch={18}
          windowSize={7}
          updateCellsBatchingPeriod={30}
          removeClippedSubviews={Platform.OS === 'android'}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No countries match "{searchQuery}"
              </Text>
            </View>
          }
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F4F4F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  backArrow: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginTop: -2,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E4E4E7',
    paddingHorizontal: 16,
    height: 52,
  },
  searchBarFocused: {
    borderColor: '#18181B',
    backgroundColor: '#FFFFFF',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    padding: 0,
    height: '100%',
  },
  clearIcon: {
    fontSize: 13,
    fontWeight: '800',
    color: '#71717A',
    padding: 4,
  },
  titleContainer: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: ITEM_HEIGHT,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  countryRowSelected: {
    backgroundColor: '#FEF2F2',
  },
  countryRowPressed: {
    backgroundColor: '#F4F4F5',
  },
  countryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  countryFlag: {
    fontSize: 26,
    marginRight: 14,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181B',
    flex: 1,
    letterSpacing: -0.2,
  },
  countryNameSelected: {
    fontWeight: '800',
    color: '#000000',
  },
  countryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCallingCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#71717A',
  },
  countryCallingCodeSelected: {
    color: RED,
    fontWeight: '800',
  },
  selectedCheckBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: RED,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  selectedCheckText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  divider: {
    height: DIVIDER_HEIGHT,
    backgroundColor: '#F4F4F5',
    marginLeft: 52,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#71717A',
  },
});
