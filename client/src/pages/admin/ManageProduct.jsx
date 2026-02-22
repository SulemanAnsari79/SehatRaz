import { useEffect, useState } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../../services/AdminService.js";
// import { getAllProducts } from "../../services/ProductService.js";
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiLoader,
  FiEye,
  FiFilter,
  FiDownload,
  FiX,
  FiCheck,
  FiImage,
  FiDollarSign,
  FiTrendingUp,
  FiPackage,
} from "react-icons/fi";
import {toast} from "react-toastify";

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewType, setViewType] = useState("table");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    sizes: [],
    tags: [],
    bestSeller: false,
    stock: "",
    discount: "0",
    isActive: true,
  });
  const [imageFiles, setImageFiles] = useState([null, null, null, null]);
  const [sizeInput, setSizeInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  // Size tag management
  const addSizeTag = () => {
    if (sizeInput.trim() && !formData.sizes.includes(sizeInput.trim())) {
      setFormData(prev => ({
        ...prev,
        sizes: [...prev.sizes, sizeInput.trim()]
      }));
      setSizeInput("");
    }
  };

  const removeSizeTag = (sizeToRemove) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter(size => size !== sizeToRemove)
    }));
  };

  const handleSizeKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSizeTag();
    }
  };

  // Tag management
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search and filters
  useEffect(() => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (filterCategory !== "all") {
      filtered = filtered.filter((product) => product.category === filterCategory);
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((product) =>
        filterStatus === "active" ? product.isActive : !product.isActive
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, filterCategory, filterStatus]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProducts();
      setProducts(response.data.products  || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products");
      console.error("Fetch products error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setFormData(product);
    setModalMode("view");
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    console.log("handleEditProduct called with product:", product);
    setSelectedProduct(product);
    // Create a clean formData object with all necessary fields
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      category: product.category || "",
      sizes: product.sizes || [],
      tags: product.tags || [],
      bestSeller: product.bestSeller || false,
      stock: product.stock || "",
      discount: product.discount || "0",
      isActive: product.isActive !== undefined ? product.isActive : true,
      images: product.images || [] // Keep for reference, but won't be sent
    });
    setImageFiles([null, null, null, null]); // Reset image files for new uploads
    setSizeInput("");
    setTagInput("");
    setModalMode("edit");
    setShowModal(true);
    console.log("Modal mode set to edit, showModal set to true");
  };

  const handleAddProduct = () => {
    console.log("handleAddProduct called");
    setSelectedProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      sizes: [],
      tags: [],
      bestSeller: false,
      stock: "",
      discount: "0",
      isActive: true,
    });
    setImageFiles([null, null, null, null]);
    setSizeInput("");
    setTagInput("");
    setModalMode("add");
    setShowModal(true);
    console.log("showModal set to true");
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        setProducts(products.filter((product) => product._id !== id));
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete product");
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await updateProduct(id, { isActive: !currentStatus });
      setProducts(
        products.map((product) =>
          product._id === id ? { ...product, isActive: !currentStatus } : product
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update product status");
    }
  };

  const handleSaveProduct = async () => {
    try {
      const formDataToSend = new FormData();

      // Only send updatable fields
      const updatableFields = ['name', 'description', 'price', 'category', 'sizes', 'tags', 'bestSeller', 'stock', 'discount', 'isActive'];

      updatableFields.forEach(key => {
        if (key in formData) {
          if (key === 'sizes' && Array.isArray(formData[key])) {
            formDataToSend.append(key, JSON.stringify(formData[key]));
          } else if (key === 'tags' && Array.isArray(formData[key])) {
            formDataToSend.append(key, JSON.stringify(formData[key]));
          } else {
            formDataToSend.append(key, formData[key]);
          }
        }
      });

      // Append image files with correct field names
      imageFiles.forEach((file, index) => {
        if (file) {
          formDataToSend.append(`image${index + 1}`, file);
        }
      });

      if (modalMode === "add") {
        const response = await createProduct(formDataToSend);
        if (response.data.success) {
          toast.success("Product added successfully");
          fetchProducts(); // Refresh the product list
        } else {
          throw new Error(response.data.message || "Failed to add product");
        }
      } else if (modalMode === "edit") {
        const response = await updateProduct(selectedProduct._id, formDataToSend);
        if (response.data.success) {
          toast.success("Product updated successfully");
          fetchProducts(); // Refresh the product list
        } else {
          throw new Error(response.data.message || "Failed to update product");
        }
      }
      setShowModal(false);
      setSelectedProduct(null);
      setImageFiles([null, null, null, null]);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save product");
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name.startsWith("image")) {
      const index = parseInt(name.replace("image", "")) - 1;
      const newImageFiles = [...imageFiles];
      newImageFiles[index] = files[0];
      setImageFiles(newImageFiles);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const getCategories = () => {
    const categories = new Set(products.map((p) => p.category));
    return Array.from(categories).filter(Boolean);
  };

  const calculateDiscountedPrice = (price, discount) => {
    return (price * (1 - discount / 100)).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="text-4xl text-purple-500 animate-spin" />
          <p className="text-gray-600 font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Manage Products</h1>
            <p className="text-gray-600 mt-2">
              Total Products: <span className="font-semibold text-purple-600">{products.length}</span>
            </p>
          </div>
          <button
            onClick={handleAddProduct}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition"
          >
            <FiPlus size={20} />
            Add Product
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Filter by Category */}
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Categories</option>
              {getCategories().map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* View Type Toggle and Export */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">View:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setViewType("grid")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewType === "grid"
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewType("table")}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewType === "table"
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Table
              </button>
            </div>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
            <FiDownload size={20} />
            Export
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewType === "grid" && (
        <div>
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {product.images && product.images[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover"/>
                    ) : (
                      <FiImage className="text-gray-400 text-5xl" />
                    )}
                    {product.discount > 0 && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        -{product.discount}%
                      </div>
                    )}
                    {!product.isActive && (
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">Inactive</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4 space-y-3">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Category and Stock */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">
                        {product.category}
                      </span>
                      <span className={`font-medium ${product.stock > 5 ? "text-green-600" : "text-red-600"}`}>
                        Stock: {product.stock}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl font-bold text-gray-900">
                          ₹{calculateDiscountedPrice(product.price, product.discount)}
                        </span>
                        {product.discount > 0 && (
                          <span className="text-sm text-gray-500 line-through">
                            ₹{product.price}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="space-y-3 pt-2 border-t border-gray-200">
                      <span className={`block text-center text-xs font-medium w-full px-3 py-1.5 rounded-lg ${
                        product.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewProduct(product)}
                          className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium text-sm"
                        >
                          <FiEye size={16} className="mx-auto" />
                        </button>
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="flex-1 p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition font-medium text-sm"
                        >
                          <FiEdit2 size={16} className="mx-auto" />
                        </button>
                        <button
                          onClick={() =>
                            handleToggleStatus(product._id, product.isActive)
                          }
                          className={`flex-1 p-2 rounded-lg transition font-medium text-sm ${
                            product.isActive
                              ? "text-red-600 hover:bg-red-50"
                              : "text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {product.isActive ? (
                            <FiX size={16} className="mx-auto" />
                          ) : (
                            <FiCheck size={16} className="mx-auto" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="flex-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium text-sm"
                        >
                          <FiTrash2 size={16} className="mx-auto" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FiPackage className="text-5xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                {searchTerm || filterCategory !== "all" || filterStatus !== "all"
                  ? "No products found matching your criteria"
                  : "No products yet"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewType === "table" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Product List</h2>
            <p className="text-sm text-gray-500 mt-1">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {filteredProducts.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr
                      key={product._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <FiPackage className="text-purple-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ₹{calculateDiscountedPrice(product.price, product.discount)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`font-medium ${
                            product.stock > 5
                              ? "text-green-600"
                              : product.stock > 0
                              ? "text-orange-600"
                              : "text-red-600"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {product.discount > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-medium">
                            -{product.discount}%
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {product.isActive ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FiCheck size={14} className="mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <FiX size={14} className="mr-1" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleViewProduct(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View"
                          >
                            <FiEye size={18} />
                          </button>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                            title="Edit"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            onClick={() =>
                              handleToggleStatus(product._id, product.isActive)
                            }
                            className={`p-2 rounded-lg transition ${
                              product.isActive
                                ? "text-red-600 hover:bg-red-50"
                                : "text-green-600 hover:bg-green-50"
                            }`}
                            title={product.isActive ? "Deactivate" : "Activate"}
                          >
                            {product.isActive ? (
                              <FiX size={18} />
                            ) : (
                              <FiCheck size={18} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500 font-medium">
                  {searchTerm || filterCategory !== "all" || filterStatus !== "all"
                    ? "No products found matching your criteria"
                    : "No products yet"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {modalMode === "view"
                  ? "Product Details"
                  : modalMode === "add"
                  ? "Add New Product"
                  : "Edit Product"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:opacity-80 transition"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Product Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Product Name 
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      disabled={modalMode === "view"}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      disabled={modalMode === "view"}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                      placeholder="Enter product description"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Category *
                      </label>
                      <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleFormChange}
                        disabled={modalMode === "view"}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                        placeholder="e.g., Supplements"
                      />
                    </div>
                  </div>

                  {/* Product Images */}
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((index) => (
                      <div key={index}>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Image {index} {index === 1 ? '*' : '(Optional)'}
                        </label>
                        <input
                          type="file"
                          name={`image${index}`}
                          onChange={handleFormChange}
                          disabled={modalMode === "view"}
                          accept="image/*"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                        />
                        {imageFiles[index - 1] && (
                          <p className="text-sm text-gray-600 mt-1">
                            {imageFiles[index - 1].name}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Pricing & Stock
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleFormChange}
                      disabled={modalMode === "view"}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount}
                      onChange={handleFormChange}
                      disabled={modalMode === "view"}
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleFormChange}
                      disabled={modalMode === "view"}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Sizes
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.sizes.map((size, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                        >
                          {size}
                          {modalMode !== "view" && (
                            <button
                              type="button"
                              onClick={() => removeSizeTag(size)}
                              className="ml-2 text-purple-600 hover:text-purple-800"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    {modalMode !== "view" && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={sizeInput}
                          onChange={(e) => setSizeInput(e.target.value)}
                          onKeyPress={handleSizeKeyPress}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Add size (e.g., S, M, L)"
                        />
                        <button
                          type="button"
                          onClick={addSizeTag}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                        >
                          {tag}
                          {modalMode !== "view" && (
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-2 text-green-600 hover:text-green-800"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    {modalMode !== "view" && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={handleTagKeyPress}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Add tag (e.g., skin, eye, ear, dry skin)"
                        />
                        <button
                          type="button"
                          onClick={addTag}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="bestSeller"
                        checked={formData.bestSeller}
                        onChange={handleFormChange}
                        disabled={modalMode === "view"}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-gray-900 font-medium">Mark as Best Seller</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Status
                </h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleFormChange}
                    disabled={modalMode === "view"}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-gray-900 font-medium">Product Active</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Close
              </button>
              {(modalMode === "edit" || modalMode === "add") && (
                <button onClick={handleSaveProduct} className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition font-medium">
                  {modalMode === "add" ? "Add Product" : "Save Changes"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManageProducts;
