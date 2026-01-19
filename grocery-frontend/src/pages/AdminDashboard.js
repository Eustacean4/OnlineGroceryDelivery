import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Store, 
  FileText, 
  ShoppingCart, 
  Tag, 
  TrendingUp, 
  Settings,
  LogOut,
  User,
  Package,
  DollarSign,
  Clock,
  XCircle,
  AlertTriangle,
  Ticket,
  TicketCheck,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  CheckCircle,
  X,
  Download,
  ArrowLeft
} from 'lucide-react';
import './AdminDashboard.css';
import AdminSettings from '../components/AdminSettings';
import TicketSystem from '../components/TicketSystem';

// API configuration
const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Adjust this to your Laravel API URL

// API utility functions
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('auth_token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
      return;
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

const testApplicationsAPI = async () => {
  try {
    console.log('=== Testing Applications API ===');
    const token = localStorage.getItem('auth_token');
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    
    console.log('Token present:', !!token);
    console.log('User role:', user.role);
    console.log('User ID:', user.id);
    
    const response = await fetch(`${API_BASE_URL}/admin/applications/all`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Applications data received:', data);
      console.log('Number of applications:', data.length);
    } else {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [logoEdit, setLogoEdit] = useState({ show: false, business: null });


  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    activeCustomers: 0,
    vendors: 0,
    productsInStock: 0,
    dailyRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0
  });

  // State for entity data
  const [users, setUsers] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [viewedProduct, setViewedProduct] = useState(null);
  const [productModalType, setProductModalType] = useState('');
  const [productFormData, setProductFormData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [viewedItem, setViewedItem] = useState(null);
  const [applicationFiles, setApplicationFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const [fileModalType, setFileModalType] = useState(''); 
  const [userTickets, setUserTickets] = useState([]);
  const [selectedUserTicket, setSelectedUserTicket] = useState(null);
  const [ticketResponse, setTicketResponse] = useState('');

    // User Management Functions
  const [viewedUser, setViewedUser] = useState(null);

  const handleViewUser = (user) => {
    setViewedUser(user);
    setShowModal(true);
    setModalType('viewUser');
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (!token) {
      navigate('/login');
      return;
    }

    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.role !== 'admin') {
        navigate('/');
        return;
      }
      setUser(userData);
    }

    fetchDashboardData();

    setTimeout(() => {
      testApplicationsAPI();
    }, 1000); // Wait a second after page load

  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Starting to fetch dashboard data...');

      const results = await Promise.allSettled([
        apiRequest('/users'),
        apiRequest('/businesses'),
        apiRequest('/categories'),
        apiRequest('/products'),
        apiRequest('/admin/applications/all'),
        apiRequest('/admin/applications/stats'),
        apiRequest('/admin/tickets')
        
      ]);

      const [usersRes, businessesRes, categoriesRes, productsRes, applicationsRes, statsRes, ticketsRes] = results;

      console.log('📊 API Results:');
      console.log('Users:', usersRes.status);
      console.log('Businesses:', businessesRes.status);
      console.log('Categories:', categoriesRes.status);
      console.log('Products:', productsRes.status);
      console.log('Applications:', applicationsRes.status);
      console.log('Stats:', statsRes.status);

      // Handle tickets
      if (ticketsRes.status === 'fulfilled') {
        console.log('✅ Tickets loaded:', ticketsRes.value);
        setUserTickets(ticketsRes.value);
      } else {
        console.error('❌ Tickets failed:', ticketsRes.reason);
        setUserTickets([]);
      }

      // Handle applications specifically
      if (applicationsRes.status === 'fulfilled') {
        console.log('✅ Applications loaded:', applicationsRes.value);
        setBusinessApplications(applicationsRes.value);
      } else {
        console.error('❌ Applications failed:', applicationsRes.reason);
        setBusinessApplications([]);
      }

      if (statsRes.status === 'fulfilled') {
        console.log('✅ Stats loaded:', statsRes.value);
        setApplicationStats(statsRes.value);
      } else {
        console.error('❌ Stats failed:', statsRes.reason);
        setApplicationStats({});
      }

      // Handle other data as before...
      const usersData = usersRes.status === 'fulfilled' ? usersRes.value : [];
      const businessesData = businessesRes.status === 'fulfilled' ? businessesRes.value : [];
      const categoriesData = categoriesRes.status === 'fulfilled' ? categoriesRes.value : [];
      const productsData = productsRes.status === 'fulfilled' ? productsRes.value : [];

      setUsers(usersData);
      setBusinesses(businessesData);
      setCategories(categoriesData);
      setProducts(productsData);

    } catch (error) {
      console.error('💥 Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  const openEditLogoModal = (business) => {
    setLogoEdit({ show: true, business });
  };


  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    navigate('/login');
  };

  const handleViewUserTicket = (ticket) => {
    setSelectedUserTicket(ticket);
    setModalType('viewUserTicket');
    setShowModal(true);
  };

  const handleRespondToTicket = async (ticketId) => {
    if (!ticketResponse.trim()) {
      alert('Please enter a response');
      return;
    }

    try {
      await apiRequest(`/admin/tickets/${ticketId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ 
          response: ticketResponse,
          status: 'resolved' // or keep current status
        })
      });
      
      // Refresh tickets
      fetchDashboardData();
      setShowModal(false);
      setTicketResponse('');
    } catch (error) {
      console.error('Error responding to ticket:', error);
      alert('Failed to send response');
    }
  };

  const handleViewApplication = async (application) => {
    try {
      const detailedApp = await apiRequest(`/admin/applications/${application.id}`);
      setSelectedApplication(detailedApp);
      
      // Fetch files for this application
      setFilesLoading(true);
      try {
        const filesData = await apiRequest(`/admin/applications/${application.id}/files`);
        setApplicationFiles(filesData.files || []);
      } catch (error) {
        console.error('Error fetching application files:', error);
        setApplicationFiles([]);
      } finally {
        setFilesLoading(false);
      }
      
      setModalType('viewApplication');
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching application details:', error);
    }
  };

  const requestDelete = (type, id) => {
    setDeleteConfirm({ show: true, type, id });
  };

  const handleDeleteConfirmed = async () => {
    const { type, id } = deleteConfirm;

    try {
      if (type === 'user') {
        await apiRequest(`/users/${id}`, { method: 'DELETE' });
        setUsers(users.filter(u => u.id !== id));
      } else if (type === 'business') {
        await apiRequest(`/businesses/${id}`, { method: 'DELETE' });
        setBusinesses(businesses.filter(b => b.id !== id));
      } else if (type === 'product') {
        await apiRequest(`/products/${id}`, { method: 'DELETE' });
        setProducts(products.filter(p => p.id !== id));
      } else if (type === 'category') {
        await apiRequest(`/categories/${id}`, { method: 'DELETE' });
        setCategories(categories.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete');
    } finally {
      setDeleteConfirm({ show: false, type: '', id: null });
    }
  };



  // File viewing functions:
  const handleViewFile = (file) => {
    // Add current file to history for back navigation
    setFileViewHistory(prev => [...prev, { file, modalType: fileModalType }]);
    
    setViewingFile(file);
    
    if (file.is_image) {
      setFileModalType('image');
    } else if (file.mime_type === 'application/pdf') {
      setFileModalType('pdf');
    } else {
      setFileModalType('document');
    }
    
    // Don't change showModal or modalType if we're already in file view
    if (modalType !== 'viewFile') {
      setShowModal(true);
      setModalType('viewFile');
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      if (file.download_url) {
        // For documents with specific download URLs
        const response = await fetch(file.download_url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Download failed');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else if (file.url) {
        // For storefront photos or direct URLs
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handleGoBackInFileView = () => {
    if (fileViewHistory.length > 0) {
      const previous = fileViewHistory[fileViewHistory.length - 1];
      setFileViewHistory(prev => prev.slice(0, -1));
      
      if (fileViewHistory.length === 1) {
        // Going back to application view
        setModalType('viewApplication');
        setViewingFile(null);
        setFileModalType('');
      } else {
        // Going back to previous file
        const previousFile = fileViewHistory[fileViewHistory.length - 2];
        setViewingFile(previousFile.file);
        setFileModalType(previousFile.modalType);
      }
    } else {
      // No history, go back to application view
      setModalType('viewApplication');
      setViewingFile(null);
      setFileModalType('');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleApproveApplication = async (applicationId) => {
    try {
      await apiRequest(`/admin/applications/${applicationId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ admin_notes: adminNotes })
      });
      // Refresh data
      fetchDashboardData();
      setShowModal(false);
      setAdminNotes('');
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Failed to approve application');
    }
  };

  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try {
      await apiRequest(`/admin/tickets/${ticketId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      
      // Update the ticket in state
      setUserTickets(userTickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: newStatus }
          : ticket
      ));
    } catch (error) {
      console.error('Error updating ticket status:', error);
      alert('Failed to update ticket status');
    }
  };

  const handleRejectApplication = async (applicationId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      await apiRequest(`/admin/applications/${applicationId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ 
          reason: rejectionReason,
          admin_notes: adminNotes 
        })
      });
      // Refresh data
      fetchDashboardData();
      setShowModal(false);
      setRejectionReason('');
      setAdminNotes('');
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application');
    }
  };


  const closeModal = () => {
    setShowModal(false);
    
    // Clear ALL modal-related state
    setModalType('');
    setEditingItem(null);
    setFormData({});
    setViewedItem(null);
    
    // Clear file-related state
    setViewingFile(null);
    setFileModalType('');
    setFileViewHistory([]);
    
    // Clear application-related state
    setSelectedApplication(null);
    setApplicationFiles([]);
    setAdminNotes('');
    setRejectionReason('');
    
    // Clear product-related state
    setViewedProduct(null);
    setProductModalType('');
    setProductFormData({});
    
    // Clear user and business related state
    setViewedUser(null);
    setViewedBusiness(null);
    setViewedProductsBusiness(null);
    setBusinessProducts([]);
    setProductsError(null);
  };

  // Business Management Functions

  const [viewedBusiness, setViewedBusiness] = useState(null);
  const [viewedProductsBusiness, setViewedProductsBusiness] = useState(null);
  const [businessProducts, setBusinessProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);

  // Enhanced: When viewing a business, also fetch and show its products
  const handleViewBusiness = async (business) => {
    setViewedBusiness(business);
    setShowModal(true);
    setModalType('viewBusiness');
    // Fetch products for this business
    setViewedProductsBusiness(business); // for modal fallback
    setBusinessProducts([]);
    setProductsError(null);
    setProductsLoading(true);
    try {
      const products = await apiRequest(`/businesses/${business.id}/products`);
      setBusinessProducts(Array.isArray(products) ? products : (products.products || []));
    } catch (err) {
      setProductsError('Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  };

  const handleEditBusiness = (business) => {
    console.log('✏️ Starting business edit for:', business);
    setEditingItem(business);
    setFormData({
      name: business.name || '',
      email: business.email || '',
      address: business.address || '',
      phone: business.phone || '',
      logo: business.logo || '', // Keep the current logo path
      logoFile: null // Reset file input
    });
    setModalType('editBusiness');
    setShowModal(true);
    console.log('📝 Set form data:', {
      name: business.name,
      email: business.email,
      address: business.address,
      phone: business.phone,
      logo: business.logo
    });
  };
  // Category Management Functions

  const handleAddCategory = () => {
    setEditingItem(null);
    setFormData({ name: '' });
    setModalType('addCategory');
    setShowModal(true);
  };

  const handleEditCategory = (category) => {
    setEditingItem(category);
    setFormData({ name: category.name });
    setModalType('editCategory');
    setShowModal(true);
  };

  const handleSubmitCategory = async (e) => {
  e.preventDefault();
  try {
    if (editingItem) {
      // Update existing category
      const updatedCategory = await apiRequest(`/categories/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      setCategories(categories.map(cat =>
        cat.id === editingItem.id ? { ...cat, ...updatedCategory.category } : cat
      ));
    } else {
      // Create new category
      await apiRequest('/categories', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      // Re-fetch categories to get the new one with full details (including created_at)
      const categoriesData = await apiRequest('/categories');
      setCategories(categoriesData);
    }

    setShowModal(false);
    setFormData({});
  } catch (error) {
    console.error('Error saving category:', error);
    alert('Failed to save category');
  }
};


  const handleSubmitBusiness = async (e) => {
    e.preventDefault();

    try {
      console.log('🔄 Starting business update...');
      console.log('📝 Form data:', formData);
      console.log('🏢 Editing item:', editingItem);
      
      const token = localStorage.getItem('auth_token');
      
      // Always use FormData for consistency
      const formDataToSend = new FormData();
      
      // Append text fields
      formDataToSend.append('name', formData.name || '');
      formDataToSend.append('email', formData.email || '');
      formDataToSend.append('address', formData.address || '');
      formDataToSend.append('phone', formData.phone || '');
      
      // Append logo file if user selected one
      if (formData.logoFile) {
        console.log('📷 Logo file selected:', formData.logoFile.name, formData.logoFile.size);
        formDataToSend.append('logo', formData.logoFile);
      } else {
        console.log('❌ No logo file selected');
      }

      // Log what we're sending
      console.log('📤 Sending FormData with:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`  ${key}:`, value);
      }

      formDataToSend.append('_method', 'PUT');
      const response = await fetch(`${API_BASE_URL}/businesses/${editingItem.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData
        },
        body: formDataToSend
      });

      console.log('📨 Response status:', response.status);
      console.log('📨 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedBusiness = await response.json();
      console.log('✅ Updated business data:', updatedBusiness);

      setBusinesses(businesses.map(business =>
        business.id === editingItem.id
          ? { ...business, ...updatedBusiness.business }
          : business
      ));

      setShowModal(false);
      setFormData({});
      
      console.log('✅ Business update completed successfully');
      
    } catch (error) {
      console.error('💥 Error updating business:', error);
      alert('Failed to update business: ' + error.message);
    }
  };


  const [businessApplications, setBusinessApplications] = useState([]);
  const [applicationStats, setApplicationStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [fileViewHistory, setFileViewHistory] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    type: '', // 'user', 'business', 'product', etc.
    id: null
  });


  // --- Analytics State ---
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState(null);

  // Fetch analytics when Analytics tab is active
  useEffect(() => {
    if (activeTab === 'analytics') {
      setMetricsLoading(true);
      setMetricsError(null);
      apiRequest('/admin/metrics')
        .then(data => setMetrics(data))
        .catch(() => setMetricsError('Failed to load analytics'))
        .finally(() => setMetricsLoading(false));
    }
  }, [activeTab]);

  // --- Analytics Card Icons ---
  const metricIcons = {
    totalOrders: <ShoppingCart size={40} />,
    totalRevenue: <DollarSign size={40} />,
    activeRiders: <Users size={40} />, // or a custom cyclist icon if available
    avgDeliveryTime: <Clock size={40} />,
    cancelledOrders: <XCircle size={40} />,
    failedOrders: <AlertTriangle size={40} />,
  };


  // --- Analytics Colors ---
  const metricColors = {
    totalOrders: '#4f8cff',
    totalRevenue: '#2ecc71',
    activeRiders: '#f1c40f',
    avgDeliveryTime: '#e67e22',
    cancelledOrders: '#e74c3c',
    failedOrders: '#8e44ad',
  };

  // --- Analytics Render ---
  // (Removed duplicate renderAnalytics declaration)

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={18} /> },
    { id: 'users', label: 'User Management', icon: <Users size={18} /> },
    { id: 'businesses', label: 'Business Management', icon: <Store size={18} /> },
    { id: 'business-applications', label: 'Business Applications', icon: <FileText size={18} /> },
    { id: 'products', label: 'Product Management', icon: <ShoppingCart size={18} /> },
    { id: 'categories', label: 'Category Management', icon: <Tag size={18} /> },
    { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    { id: 'Ticket System', label: 'Ticket System', icon: <Ticket size={18} /> },
  ];

  // Product Management Functions

  // Product Management Functions
  const handleViewProduct = (product) => {
    // First clear any existing modal state
    closeModal();
    
    // Then set the new product data
    setTimeout(() => {
      setViewedProduct(product);
      setProductModalType('view');
      setModalType('viewProduct');
      setShowModal(true);
    }, 10);
  };

  const handleEditProduct = (product) => {
    console.log('✏️ Starting product edit for:', product);
    
    // First clear any existing modal state
    closeModal();
    
    // Then set the new product data
    setTimeout(() => {
      setEditingItem(product);
      setProductFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        stock: product.stock || product.quantity || '',
        category_name: product.category?.name || '',
        business_id: product.business?.id || product.business_id || '',
        image: product.image || '', // Keep current image path
        imageFile: null // Reset file input
      });
      setProductModalType('edit');
      setModalType('editProduct');
      setShowModal(true);
      
      console.log('📝 Set product form data:', {
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock || product.quantity,
        category_name: product.category?.name,
        business_id: product.business?.id || product.business_id,
        image: product.image
      });
    }, 10);
  };

  const handleAddProduct = () => {
    // First clear any existing modal state
    closeModal();
    
    // Then set the new product data
    setTimeout(() => {
      setEditingItem(null);
      setProductFormData({ 
        name: '', 
        description: '', 
        price: '', 
        stock: '', 
        category_name: '', 
        business_id: '' 
      });
      setProductModalType('add');
      setModalType('addProduct');
      setShowModal(true);
    }, 10);
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    
    try {
      console.log('🔄 Starting product submission...');
      console.log('📝 Product form data:', productFormData);
      console.log('🎭 Modal type:', productModalType);
      console.log('✏️ Editing item:', editingItem);
      
      const token = localStorage.getItem('auth_token');
      const formDataToSend = new FormData();
      
      // Add all text fields
      if (productFormData.name) {
        formDataToSend.append('name', productFormData.name);
        console.log('📝 Added name:', productFormData.name);
      }
      if (productFormData.description) {
        formDataToSend.append('description', productFormData.description);
        console.log('📝 Added description:', productFormData.description);
      }
      if (productFormData.price) {
        formDataToSend.append('price', productFormData.price);
        console.log('💰 Added price:', productFormData.price);
      }
      if (productFormData.stock) {
        formDataToSend.append('stock', productFormData.stock);
        console.log('📦 Added stock:', productFormData.stock);
      }
      if (productFormData.category_name) {
        formDataToSend.append('category_name', productFormData.category_name);
        console.log('🏷️ Added category:', productFormData.category_name);
      }
      if (productFormData.business_id) {
        formDataToSend.append('business_id', productFormData.business_id);
        console.log('🏢 Added business_id:', productFormData.business_id);
      }
      
      // Add image file if selected
      if (productFormData.imageFile) {
        formDataToSend.append('image', productFormData.imageFile);
        console.log('🖼️ Added image file:', productFormData.imageFile.name, productFormData.imageFile.size);
      } else {
        console.log('❌ No image file selected');
      }

      // Log what we're sending
      console.log('📤 Sending FormData with:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`  ${key}:`, value);
      }

      let url, method;
      if (productModalType === 'edit' && editingItem) {
        url = `${API_BASE_URL}/products/${editingItem.id}`;
        method = 'POST'; // must be POST for FormData with files
        formDataToSend.append('_method', 'PUT'); // Laravel method spoofing
        console.log('✏️ UPDATING product with ID:', editingItem.id);
      } else {
        url = `${API_BASE_URL}/products`;
        method = 'POST';
        console.log('➕ CREATING new product');
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData
        },
        body: formDataToSend
      });

      console.log('📨 Response status:', response.status);
      console.log('📨 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Server response:', result);

      if (productModalType === 'edit' && editingItem) {
        // Update existing product in list
        setProducts(products.map(prod => 
          prod.id === editingItem.id 
            ? { ...prod, ...result.product } 
            : prod
        ));
        console.log('✅ Updated product in list');
      } else {
        // Add new product to list
        setProducts([...products, result.product]);
        console.log('✅ Added new product to list');
      }
      
      // Close modal and reset state
      setShowModal(false);
      setProductFormData({});
      setEditingItem(null);
      setProductModalType('');
      
      console.log('✅ Product operation completed successfully');
      
    } catch (error) {
      console.error('💥 Error with product operation:', error);
      alert('Failed to save product: ' + error.message);
    }
  };

  const renderProducts = () => (
    <div className="table-section">
      <div className="section-header">
        <h2>Product Management</h2>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search products..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="add-btn" onClick={handleAddProduct}>Add Product</button>
        </div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>  {/* Add this */}
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Business</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.filter(p =>
              p.name?.toLowerCase().includes(searchTerm.toLowerCase())
            ).map(product => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>  {/* Add this cell */}
                  <img 
                    src={product.image ? `http://127.0.0.1:8000/storage/${product.image}` : 'https://via.placeholder.com/40x40?text=No+Image'} 
                    alt={product.name} 
                    style={{ width: 40, height: 40, borderRadius: '4px', objectFit: 'cover' }}
                  />
                </td>
                <td>{product.name}</td>
                <td>{product.category?.name || 'N/A'}</td>
                <td>{product.price}</td>
                <td>{product.stock ?? product.quantity ?? 'N/A'}</td>
                <td>{product.business?.name || product.business_id || 'N/A'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-view" onClick={() => handleViewProduct(product)}>View</button>
                    <button className="btn-edit" onClick={() => handleEditProduct(product)}>Edit</button>
                    <button className="btn-delete" onClick={() => requestDelete('product', product.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="welcome-section">
        <h1>Welcome back, {user?.name}!</h1>
        <p>Here's what's happening with your platform today.</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon"><BarChart3 size={22} /></div>
          <div className="metric-info">
            <h3>{dashboardData.totalOrders}</h3>
            <p>Total Orders Today</p>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon"><Users size={22} /></div>
          <div className="metric-info">
            <h3>{dashboardData.activeCustomers}</h3>
            <p>Active Customers</p>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon"><Store size={22} /></div>
          <div className="metric-info">
            <h3>{dashboardData.vendors}</h3>
            <p>Registered Vendors</p>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon"><Package size={22} /></div>
          <div className="metric-info">
            <h3>{dashboardData.productsInStock}</h3>
            <p>Products in Stock</p>
          </div>
        </div>
      </div>

      <div className="revenue-section">
        <div className="revenue-card">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-icon">👤</span>
              <span className="activity-text">New user registered</span>
              <span className="activity-time">2 hours ago</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">🏪</span>
              <span className="activity-text">Business application submitted</span>
              <span className="activity-time">5 hours ago</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">📦</span>
              <span className="activity-text">New product added</span>
              <span className="activity-time">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => {
    const filteredUsers = users.filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === '' || user.role === filterRole;
      return matchesSearch && matchesRole;
    });

    return (
      <div className="table-section">
        <div className="section-header">
          <h2>User Management</h2>
          <div className="header-actions">
            <input 
              type="text" 
              placeholder="Search users..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="filter-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="rider">Rider</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-view" onClick={() => handleViewUser(user)}>View</button>
                      <button className="btn-delete" onClick={() => requestDelete('user', user.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderBusinesses = () => (
    <div className="table-section">
      <div className="section-header">
        <h2>Business Management</h2>
        <div className="header-actions">
          <input 
            type="text" 
            placeholder="Search businesses..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Owner</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map(business => (
              <tr key={business.id}>
                <td>{business.id}</td>
                <td><img 
                      src={business.logo ? `http://127.0.0.1:8000/storage/${business.logo}` : '/placeholder-logo.png'} 
                      alt={`${business.name} logo`} 
                      style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', marginRight: 8 }}
                    />
                {business.name}</td>
                <td>{business.email}</td>
                <td>{business.phone}</td>
                <td>{business.address}</td>
                <td>{
                  business.vendor?.name
                    ? business.vendor.name
                    : business.vendor_id
                      ? (() => {
                          const owner = users.find(u => u.id === business.vendor_id);
                          return owner ? owner.name : 'Unknown Owner';
                        })()
                      : 'N/A'
                }</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-view" onClick={() => handleViewBusiness(business)}>View</button>
                    <button className="btn-edit" onClick={() => handleEditBusiness(business)}>Edit</button>
                    <button className="btn-delete" onClick={() =>requestDelete('business', business.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBusinessApplications = () => (
    <div className="table-section">
      <div className="section-header">
        <h2>Business Applications</h2>
        <div className="header-actions">
          <div className="stats-summary">
            <span className="stat-item">Pending: {applicationStats.pending || 0}</span>
            <span className="stat-item">Approved: {applicationStats.approved || 0}</span>
            <span className="stat-item">Rejected: {applicationStats.rejected || 0}</span>
          </div>
          <select 
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Business Name</th>
              <th>Applicant</th>
              <th>Email</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {businessApplications
              .filter(app => filterStatus === '' || app.status === filterStatus)
              .map(application => (
              <tr key={application.id}>
                <td>{application.id}</td>
                <td>{application.name}</td>
                <td>{application.user?.name}</td>
                <td>{application.email}</td>
                <td>
                  <span className={`status-badge ${application.status}`}>
                    {application.status}
                  </span>
                </td>
                <td>{new Date(application.submitted_at).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-view" onClick={() => handleViewApplication(application)}>
                      Review
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCategories = () => (
    <div className="table-section">
      <div className="section-header">
        <h2>Category Management</h2>
        <div className="header-actions">
          <input 
            type="text" 
            placeholder="Search categories..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="add-btn" onClick={handleAddCategory}>Add Category</button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase())).map(category => (
              <tr key={category.id}>
                <td>{category.id}</td>
                <td>{category.name}</td>
                <td>{new Date(category.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-edit" onClick={() => handleEditCategory(category)}>Edit</button>
                    <button className="btn-delete" onClick={() => requestDelete('category', category.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // --- Analytics Render ---
  const renderAnalytics = () => {
    if (metricsLoading) return <div>Loading analytics...</div>;
    if (metricsError) return <div style={{ color: 'red' }}>{metricsError}</div>;
    if (!metrics) return null;
    return (
      <div className="analytics-section" style={{padding: '24px'}}>
        <h2 style={{marginBottom: 24}}>
          <TrendingUp size={20} style={{ marginRight: 8 }} />
          Business Analytics
        </h2>
        <div className="metrics-cards" style={{display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32}}>
          {Object.entries({
            totalOrders: metrics.totalOrders,
            totalRevenue: `₺${metrics.totalRevenue}`,
            activeRiders: metrics.activeRiders,
            avgDeliveryTime: `${metrics.avgDeliveryTime} min`,
            cancelledOrders: metrics.cancelledOrders,
            failedOrders: metrics.failedOrders
          }).map(([key, value]) => (
            <div key={key} className="metric-card" style={{
              background: metricColors[key],
              color: '#fff',
              borderRadius: 16,
              padding: '24px 32px',
              minWidth: 180,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontSize: 20
            }}>
              <div style={{fontSize: 36, marginBottom: 8}}>{metricIcons[key]}</div>
              <div style={{fontWeight: 700, fontSize: 28}}>{value}</div>
              <div style={{fontSize: 15, marginTop: 4, opacity: 0.85}}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</div>
            </div>
          ))}
        </div>

        {/* Top Selling Products Bar Chart */}
        <h3 style={{marginTop: 32}}>🏆 Top Selling Products</h3>
        <div style={{maxWidth: 600, marginBottom: 32}}>
          {metrics.topProducts && metrics.topProducts.length > 0 ? metrics.topProducts.map(p => (
            <div key={p.id} style={{marginBottom: 12}}>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <span style={{width: 160}}>{p.name}</span>
                <div style={{background: '#4f8cff', height: 18, width: `${Math.max(10, p.total_sold * 8)}px`, borderRadius: 8, margin: '0 12px'}}></div>
                <span style={{fontWeight: 600}}>{p.total_sold} sold</span>
              </div>
            </div>
          )) : <div style={{color: '#888'}}>No data</div>}
        </div>

        {/* Revenue by Business Bar Chart */}
        <h3>💼 Revenue by Business</h3>
        <div style={{maxWidth: 600, marginBottom: 32}}>
          {metrics.revenueByBusiness && metrics.revenueByBusiness.length > 0 ? metrics.revenueByBusiness.map(b => (
            <div key={b.id} style={{marginBottom: 12}}>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <span style={{width: 160}}>{b.name}</span>
                <div style={{background: '#2ecc71', height: 18, width: `${Math.max(10, b.revenue / 10)}px`, borderRadius: 8, margin: '0 12px'}}></div>
                <span style={{fontWeight: 600}}>₺{b.revenue}</span>
              </div>
            </div>
          )) : <div style={{color: '#888'}}>No data</div>}
        </div>

        {/* Customer Growth Line Chart (simple dots/lines) */}
        <h3>📈 Customer Growth (last 6 months)</h3>
        <div style={{maxWidth: 600, marginBottom: 32, padding: '12px 0'}}>
          {metrics.customerGrowth && metrics.customerGrowth.length > 0 ? (
            <div style={{display: 'flex', alignItems: 'flex-end', height: 80, gap: 16}}>
              {metrics.customerGrowth.slice().reverse().map((cg, idx, arr) => {
                const max = Math.max(...arr.map(c => c.count));
                return (
                  <div key={cg.month} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                    <div style={{background: '#e67e22', width: 18, height: `${(cg.count / (max || 1)) * 60}px`, borderRadius: 6, marginBottom: 4}}></div>
                    <div style={{fontSize: 13, color: '#555'}}>{cg.month.slice(2)}</div>
                    <div style={{fontSize: 13, color: '#222', fontWeight: 600}}>{cg.count}</div>
                  </div>
                );
              })}
            </div>
          ) : <div style={{color: '#888'}}>No data</div>}
        </div>

        {/* Rider Performance Table */}
        <h3>🚴 Rider Performance</h3>
        <div style={{overflowX: 'auto', maxWidth: 700}}>
          <table style={{width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)'}}>
            <thead>
              <tr style={{background: '#f8f8f8'}}>
                <th style={{padding: '10px 16px', textAlign: 'left'}}>Rider</th>
                <th style={{padding: '10px 16px', textAlign: 'center'}}>Deliveries</th>
                <th style={{padding: '10px 16px', textAlign: 'center'}}>Avg Delivery Time (min)</th>
              </tr>
            </thead>
            <tbody>
              {metrics.riderPerformance && metrics.riderPerformance.length > 0 ? metrics.riderPerformance.map(r => (
                <tr key={r.id}>
                  <td style={{padding: '10px 16px'}}>{r.name}</td>
                  <td style={{padding: '10px 16px', textAlign: 'center'}}>{r.deliveries}</td>
                  <td style={{padding: '10px 16px', textAlign: 'center'}}>{r.avgDeliveryTime}</td>
                </tr>
              )) : <tr><td colSpan={3} style={{color: '#888', textAlign: 'center'}}>No data</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'users':
        return renderUsers();
      case 'businesses':
        return renderBusinesses();
      case 'business-applications':
        return renderBusinessApplications();
      case 'products':
        return renderProducts();
      case 'categories':
        return renderCategories();
      case 'analytics':
        return renderAnalytics();
      case 'settings':
        return (
          <div className="settings-section">
            <AdminSettings />
          </div>
        );
      case 'Ticket System':
        return (
          <div className="ticket-system-section">
            <TicketSystem 
              tickets={userTickets}
              onViewTicket={handleViewUserTicket}
              onUpdateTicketStatus={handleUpdateTicketStatus}
            />
          </div>
        );
        default:
          return renderDashboard();
      }
    };

  // Modal rendering function
  // Modal rendering function - FIXED VERSION
  const renderModal = () => {
    if (!showModal) return null;

    // Add this at the beginning of renderModal function
    const renderApplicationReviewModal = () => {
      if (modalType !== 'viewApplication' || !selectedApplication) return null;

      return (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content large-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Business Application Review - {selectedApplication.name}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body application-review">
              {/* Basic application info */}
              <div className="application-info">
                <h4>Business Information</h4>
                <div><strong>Name:</strong> {selectedApplication.name}</div>
                <div><strong>Email:</strong> {selectedApplication.email}</div>
                <div><strong>Phone:</strong> {selectedApplication.phone}</div>
                <div><strong>Address:</strong> {selectedApplication.address}</div>
                <div><strong>Applicant:</strong> {selectedApplication.user?.name}</div>
                <div><strong>Status:</strong> 
                  <span className={`status-badge ${selectedApplication.status}`}>
                    {selectedApplication.status}
                  </span>
                </div>
              </div>
              
              {/* Enhanced documents section with file previews */}
              <div className="documents-section">
                <h4>Submitted Documents & Files</h4>
                
                {filesLoading ? (
                  <div>Loading files...</div>
                ) : applicationFiles.length === 0 ? (
                  <div>No files found for this application.</div>
                ) : (
                  <div className="files-grid">
                    {applicationFiles.map((file, index) => (
                      <div key={index} className="file-item">
                        <div className="file-header">
                          <div className="file-icon">
                            {file.is_image ? '🖼️' : file.mime_type === 'application/pdf' ? '📄' : '📎'}
                          </div>
                          <div className="file-info">
                            <div className="file-label">{file.label}</div>
                            <div className="file-details">
                              <span className="file-name">{file.filename}</span>
                              <span className="file-size">({formatFileSize(file.size)})</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Image thumbnail for image files */}
                        {file.is_image && (
                          <div className="file-thumbnail">
                            <img 
                              src={file.url} 
                              alt={file.label}
                              style={{
                                width: '100%',
                                height: '120px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleViewFile(file)}
                            />
                          </div>
                        )}
                        
                        <div className="file-actions">
                          <button 
                            className="btn-view-file" 
                            onClick={() => handleViewFile(file)}
                          >
                            {file.is_image ? 'View Image' : 'View'}
                          </button>
                          <button 
                            className="btn-download-file" 
                            onClick={() => handleDownloadFile(file)}
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Review actions */}
              {selectedApplication.status === 'pending' && (
                <div className="review-actions">
                  <div className="form-group">
                    <label>Admin Notes (Optional)</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add any notes about this application..."
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Rejection Reason (if rejecting)</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide reason for rejection..."
                    />
                  </div>
                </div>
              )}

              {selectedApplication.rejection_reason && (
                <div className="rejection-info">
                  <h4>Rejection Reason</h4>
                  <p>{selectedApplication.rejection_reason}</p>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              {selectedApplication.status === 'pending' ? (
                <>
                  <button 
                    className="btn-reject" 
                    onClick={() => handleRejectApplication(selectedApplication.id)}
                  >
                    Reject Application
                  </button>
                  <button 
                    className="btn-approve" 
                    onClick={() => handleApproveApplication(selectedApplication.id)}
                  >
                    Approve & Create Business
                  </button>
                </>
              ) : (
                <button className="btn-cancel" onClick={() => setShowModal(false)}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      );
    };

    // File viewing modal
    const renderFileViewModal = () => {
      if (modalType !== 'viewFile' || !viewingFile) return null;

      return (
        <div className="modal-overlay" onClick={(e) => {
          // Only close on overlay click, not on content click
          if (e.target === e.currentTarget) {
            handleGoBackInFileView();
          }
        }}>
          <div className="modal-content file-view-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="file-nav-section">
                {(fileViewHistory.length > 0) && (
                  <button 
                    className="btn-back" 
                    onClick={handleGoBackInFileView}                  
                  >
                    ← Back
                  </button>
                )}
                <h3>{viewingFile.label}</h3>
              </div>
              
              <div className="file-actions-header">
                <button 
                  className="btn-download" 
                  onClick={() => handleDownloadFile(viewingFile)}    
                >
                  📥 Download
                </button>
                <button 
                  className="modal-close" 
                  onClick={closeModal}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="modal-body file-viewer">
              {fileModalType === 'image' && (
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={viewingFile.url} 
                    alt={viewingFile.label}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML += '<p style="color: red;">Failed to load image</p>';
                    }}
                  />
                </div>
              )}
              
              {fileModalType === 'pdf' && (
                <iframe
                  src={viewingFile.url}
                  title={viewingFile.label}
                  onError={() => {
                    alert('Failed to load PDF. Please try downloading instead.');
                  }}
                />
              )}
              
              {fileModalType === 'document' && (
                <div className="document-info">
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                  <p>This file type cannot be previewed directly.</p>
                  <p><strong>File:</strong> {viewingFile.filename}</p>
                  <p><strong>Size:</strong> {formatFileSize(viewingFile.size)}</p>
                  <p><strong>Type:</strong> {viewingFile.mime_type}</p>
                  <button 
                    className="btn-download-large" 
                    onClick={() => handleDownloadFile(viewingFile)}
                  >
                    📥 Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    };

    // Product View Modal
    if (modalType === 'viewProduct' && viewedProduct) {
      return (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Product Details</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div><strong>ID:</strong> {viewedProduct.id}</div>
              <div><strong>Name:</strong> {viewedProduct.name}</div>
              <div><strong>Description:</strong> {viewedProduct.description || 'N/A'}</div>
              <div><strong>Category:</strong> {viewedProduct.category?.name || 'N/A'}</div>
              <div><strong>Price:</strong> ₺{viewedProduct.price}</div>
              <div><strong>Stock:</strong> {viewedProduct.stock ?? viewedProduct.quantity ?? 'N/A'}</div>
              <div><strong>Business:</strong> {viewedProduct.business?.name || 'N/A'}</div>
              <div><strong>Created:</strong> {viewedProduct.created_at ? new Date(viewedProduct.created_at).toLocaleString() : 'N/A'}</div>
              {viewedProduct.image && (
                <div>
                  <strong>Image:</strong>
                  <br />
                  <img 
                    src={`http://127.0.0.1:8000/storage/${viewedProduct.image}`} 
                    alt={viewedProduct.name}
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      objectFit: 'cover',
                      marginTop: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal}>Close</button>    
            </div>
          </div>
        </div>
      );
    }

    // Product Add/Edit Modal
    if ((modalType === 'addProduct' || modalType === 'editProduct')) {
      return (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalType === 'addProduct' ? 'Add New Product' : 'Edit Product'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmitProduct}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    value={productFormData.name || ''}
                    onChange={(e) => setProductFormData({...productFormData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={productFormData.description || ''}
                    onChange={(e) => setProductFormData({...productFormData, description: e.target.value})}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Price (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productFormData.price || ''}
                    onChange={(e) => setProductFormData({...productFormData, price: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={productFormData.stock || ''}
                    onChange={(e) => setProductFormData({...productFormData, stock: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={productFormData.category_name || ''}
                    onChange={(e) => setProductFormData({...productFormData, category_name: e.target.value})}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Business</label>
                  <select
                    value={productFormData.business_id || ''}
                    onChange={(e) => setProductFormData({...productFormData, business_id: e.target.value})}
                    required
                  >
                    <option value="">Select a business</option>
                    {businesses.map(business => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Product Image</label>
                  {productFormData.image && (
                    <div style={{ marginBottom: '8px' }}>
                      <img 
                        src={`http://127.0.0.1:8000/storage/${productFormData.image}`}
                        alt="Current product image"
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProductFormData({...productFormData, imageFile: e.target.files[0]})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {modalType === 'editProduct' ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // CHECK FOR APPLICATION REVIEW MODAL FIRST
    if (modalType === 'viewApplication') {
      return renderApplicationReviewModal();
    }

    // CHECK FOR FILE VIEW MODAL
    if (modalType === 'viewFile') {
      return renderFileViewModal();
    }

    // EXISTING MODAL TYPES
    if (modalType === 'viewUser' && viewedUser) {
    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>User Details</h3>
            <button className="modal-close" onClick={closeModal}>×</button>
          </div>
          <div className="modal-body">
            <div><strong>ID:</strong> {viewedUser.id}</div>
            <div><strong>Name:</strong> {viewedUser.name}</div>
            <div><strong>Email:</strong> {viewedUser.email}</div>
            <div><strong>Role:</strong> {viewedUser.role}</div>
            <div><strong>Created:</strong> {new Date(viewedUser.created_at).toLocaleString()}</div>
          </div>
          <div className="modal-footer">
            <button className="btn-cancel" onClick={closeModal}>Close</button>
          </div>
        </div>
      </div>
    );
  }

    if (modalType === 'viewBusiness' && viewedBusiness) {
      return (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Business Details</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <img 
                src={viewedBusiness.logo ? `http://127.0.0.1:8000/storage/${viewedBusiness.logo}` : '/placeholder-logo.png'} 
                alt={`${viewedBusiness.name} logo`} 
                style={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  objectFit: 'cover', 
                  marginBottom: 16 
                }} 
              />
              <div><strong>ID:</strong> {viewedBusiness.id}</div>
              <div><strong>Name:</strong> {viewedBusiness.name}</div>
              <div><strong>Email:</strong> {viewedBusiness.email}</div>
              <div><strong>Phone:</strong> {viewedBusiness.phone}</div>
              <div><strong>Address:</strong> {viewedBusiness.address}</div>
              <div><strong>Owner:</strong> {
                viewedBusiness.vendor?.name
                  ? viewedBusiness.vendor.name
                  : viewedBusiness.vendor_id
                    ? (() => {
                        const owner = users.find(u => u.id === viewedBusiness.vendor_id);
                        return owner ? owner.name : 'Unknown Owner';
                      })()
                    : 'N/A'
              }</div>
              <div><strong>Created:</strong> {new Date(viewedBusiness.created_at).toLocaleString()}</div>
              <hr style={{margin: '1em 0'}} />
              <h4>Products for this Business</h4>
              {productsLoading && <div>Loading products...</div>}
              {productsError && <div style={{color: 'red'}}>{productsError}</div>}
              {!productsLoading && !productsError && businessProducts.length === 0 && (
                <div>No products found for this business.</div>
              )}
              {!productsLoading && !productsError && businessProducts.length > 0 && (
                <table className="data-table" style={{marginTop: '0.5em'}}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businessProducts.map(product => (
                      <tr key={product.id}>
                        <td>{product.id}</td>
                        <td>{product.name}</td>
                        <td>{product.category?.name || 'N/A'}</td>
                        <td>{product.price}</td>
                        <td>{product.stock ?? product.quantity ?? 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      );
    }

    if (modalType === 'viewUserTicket' && selectedUserTicket) {
      return (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Ticket #{selectedUserTicket.id}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div><strong>Subject:</strong> {selectedUserTicket.subject}</div>
              <div><strong>User:</strong> {selectedUserTicket.user?.name}</div>
              <div><strong>Email:</strong> {selectedUserTicket.user?.email}</div>
              <div><strong>Type:</strong> {selectedUserTicket.type}</div>
              <div><strong>Priority:</strong> {selectedUserTicket.priority}</div>
              <div><strong>Status:</strong> 
                <span className={`status-badge ${selectedUserTicket.status}`}>
                  {selectedUserTicket.status}
                </span>
              </div>
              <div><strong>Created:</strong> {new Date(selectedUserTicket.created_at).toLocaleString()}</div>
              
              <div style={{marginTop: '20px'}}>
                <strong>Description:</strong>
                <p style={{background: '#f5f5f5', padding: '10px', borderRadius: '4px', marginTop: '5px'}}>
                  {selectedUserTicket.description}
                </p>
              </div>

              {selectedUserTicket.admin_response && (
                <div style={{marginTop: '20px'}}>
                  <strong>Previous Response:</strong>
                  <p style={{background: '#e8f5e8', padding: '10px', borderRadius: '4px', marginTop: '5px'}}>
                    {selectedUserTicket.admin_response}
                  </p>
                </div>
              )}

              {selectedUserTicket.status !== 'closed' && (
                <div style={{marginTop: '20px'}}>
                  <label><strong>Admin Response:</strong></label>
                  <textarea
                    value={ticketResponse}
                    onChange={(e) => setTicketResponse(e.target.value)}
                    placeholder="Type your response to the user..."
                    rows="4"
                    style={{width: '100%', marginTop: '5px'}}
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              {selectedUserTicket.status !== 'closed' ? (
                <button 
                  className="btn-approve" 
                  onClick={() => handleRespondToTicket(selectedUserTicket.id)}
                >
                  Send Response & Resolve
                </button>
              ) : (
                <button className="btn-cancel" onClick={closeModal}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }


    // Default form modals for categories and business editing
    return (
      <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              {modalType === 'addCategory' && 'Add New Category'}
              {modalType === 'editCategory' && 'Edit Category'}
              {modalType === 'editBusiness' && 'Edit Business'}
            </h3>
            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
          </div>
          
          <form onSubmit={modalType.includes('Category') ? handleSubmitCategory : handleSubmitBusiness}>
            <div className="modal-body">
              {modalType.includes('Category') && (
                <div className="form-group">
                  <label>Category Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
              )}
              
              {modalType === 'editBusiness' && (
                <>
                 <div className="form-group" style={{ textAlign: 'center' }}>
                    <img
                      src={formData.logo ? `http://127.0.0.1:8000/storage/${formData.logo}` : '/placeholder-logo.png'}
                      alt={`${formData.name || 'Business'} logo`}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        marginBottom: 8
                      }}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, logoFile: e.target.files[0] })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Business Name</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="text"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-submit">
                {editingItem ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            {/*<span className="logo-icon">🛒</span>*/}
            <span className="logo-text">Grocery delivery Admin</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <User size={20} strokeWidth={1.5} />
            </div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">Administrator</div>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        {renderContent()}
      </main>
      {deleteConfirm.show && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm({ show: false })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this {deleteConfirm.type}?</p>
            <div className="modal-footer">
              <button 
                className="modal-btn-cancel" 
                onClick={() => setDeleteConfirm({ show: false })}
              >
                Cancel
              </button>
              <button 
                className="modal-btn-delete" 
                onClick={() => handleDeleteConfirmed()}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {renderModal()}
    </div>
  );
}