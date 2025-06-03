import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Appearance } from 'react-native';
import { categoryService } from '../services/categoryService';
import { API_BASE_URL } from '../config';

const {width} = Dimensions.get('window');

const AllCategoriesScreen = ({navigation}) => {
  const colorScheme = Appearance.getColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [categories, setCategories] = useState([]);
  const [trendingCategories, setTrendingCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCategories = async () => {
    try {
      const [allCategoriesRes, trendingRes] = await Promise.all([
        categoryService.getAllCategories(),
        categoryService.getTrendingCategories()
      ]);
      
      setCategories(allCategoriesRes.data);
      setTrendingCategories(trendingRes.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Handle error appropriately
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  const renderCategory = ({item}) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
      ]}
      onPress={() => navigation.navigate('Category', {category: item})}>
      <Image 
        source={{ uri: `${API_BASE_URL}${item.image}` }} 
        style={styles.categoryImage} 
      />
      <View style={styles.categoryInfo}>
        <View style={styles.categoryHeader}>
          <Text style={[
            styles.categoryName,
            { color: isDark ? '#FFFFFF' : '#000000' }
          ]}>{item.name}</Text>
          {item.trending && (
            <View style={styles.trendingBadge}>
              <Icon name="trending-up" size={12} color="#FFFFFF" />
              <Text style={styles.trendingText}>Trending</Text>
            </View>
          )}
        </View>
        <Text style={styles.categoryDescription}>{item.description}</Text>
        <View style={styles.subCategories}>
          {item.subCategories.map((sub, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.subCategory}
              onPress={() => navigation.navigate('Category', {
                category: {
                  ...item,
                  name: sub,
                  subCategory: sub
                }
              })}>
              <Text style={styles.subCategoryText}>{sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.categoryFooter}>
          <Text style={styles.productCount}>{item.productCount}+ Products</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('Category', {category: item})}>
            <Text style={styles.viewAllText}>View All</Text>
            <Icon name="chevron-right" size={16} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#F44336" />
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? '#121212' : '#F5F5F5' }
    ]}>
      {/* Header */}
      <View style={[
        styles.header,
        { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }
      ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#F44336" />
        </TouchableOpacity>
        <Text style={[
          styles.headerTitle,
          { color: isDark ? '#FFFFFF' : '#000000' }
        ]}>All Categories</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#F44336']}
          />
        }
      >
        {/* Trending Categories */}
        {trendingCategories.length > 0 && (
          <View style={styles.brandsSection}>
            <Text style={[
              styles.sectionTitle,
              { color: isDark ? '#FFFFFF' : '#000000' }
            ]}>Trending Categories</Text>
            <FlatList
              data={trendingCategories}
              renderItem={renderCategory}
              keyExtractor={item => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.brandsList}
            />
          </View>
        )}

        {/* All Categories */}
        <View style={styles.categoriesSection}>
          <Text style={[
            styles.sectionTitle,
            { color: isDark ? '#FFFFFF' : '#000000' }
          ]}>All Categories</Text>
          {categories.map(item => renderCategory({item}))}
        </View>
      </ScrollView>
    </View>
  );
};

// ... existing styles remain the same ...

export default AllCategoriesScreen; 