import Product from '../models/productModel.js';
import { v2 as cloudinary } from 'cloudinary';

const uploadFilesToCloudinary = async (filesObject) => {
    const images = [];

    if (!filesObject) {
        return images;
    }

    for (const fileArray of Object.values(filesObject)) {
        if (!fileArray || !fileArray[0]) {
            continue;
        }

        const file = fileArray[0];
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'products',
                    public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname.split('.')[0]}`,
                    resource_type: 'auto',
                },
                (error, uploadResult) => {
                    if (error) reject(error);
                    else resolve(uploadResult);
                }
            );
            stream.end(file.buffer);
        });

        images.push(result.secure_url);
    }

    return images;
};

const parseArrayField = (value, fallback = []) => {
    if (value === undefined) {
        return fallback;
    }
    if (Array.isArray(value)) {
        return value;
    }
    return value ? JSON.parse(value) : [];
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, sizes, tags, bestSeller, discount } = req.body;

        if (!name || !description || !price || stock === undefined || !category) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const numPrice = parseFloat(price);
        const numStock = parseInt(stock, 10);
        const numDiscount = discount ? parseFloat(discount) : 0;

        if (isNaN(numPrice) || numPrice <= 0 || isNaN(numStock) || numStock < 0) {
            return res.status(400).json({ success: false, message: 'Invalid price or stock' });
        }

        let images = [];
        try {
            images = await uploadFilesToCloudinary(req.files);
        } catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError);
            return res.status(500).json({ success: false, message: 'Failed to upload image' });
        }

        if (images.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one image is required' });
        }

        let parsedSizes;
        let parsedTags;
        try {
            parsedSizes = parseArrayField(sizes, []);
            parsedTags = parseArrayField(tags, []);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return res.status(400).json({ success: false, message: 'Invalid sizes or tags format' });
        }

        const product = new Product({
            name,
            description,
            price: numPrice,
            stock: numStock,
            category,
            sizes: parsedSizes,
            tags: parsedTags,
            bestSeller: bestSeller === 'true' || bestSeller === true,
            discount: numDiscount,
            images,
        });

        await product.save();
        return res.status(200).json({ success: true, message: 'Product created successfully', product });
    } catch (error) {
        console.error('Create product error:', error);
        return res.status(500).json({ success: false, message: `Server error: ${error.message}` });
    }
};

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});
        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'No products found' });
        }
        return res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('Get products error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        return res.status(200).json({ success: true, product });
    } catch (error) {
        console.error('Get product error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock, category, sizes, tags, bestSeller, discount } = req.body;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        let uploadedImages = [];
        try {
            uploadedImages = await uploadFilesToCloudinary(req.files);
        } catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError);
            return res.status(500).json({ success: false, message: 'Failed to upload image' });
        }

        let parsedSizes;
        let parsedTags;
        try {
            parsedSizes = parseArrayField(sizes, product.sizes);
            parsedTags = parseArrayField(tags, product.tags);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return res.status(400).json({ success: false, message: 'Invalid sizes or tags format' });
        }

        if (name !== undefined) product.name = name;
        if (description !== undefined) product.description = description;
        if (price !== undefined) {
            const numPrice = parseFloat(price);
            if (isNaN(numPrice) || numPrice <= 0) {
                return res.status(400).json({ success: false, message: 'Invalid price' });
            }
            product.price = numPrice;
        }
        if (stock !== undefined) {
            const numStock = parseInt(stock, 10);
            if (isNaN(numStock) || numStock < 0) {
                return res.status(400).json({ success: false, message: 'Invalid stock' });
            }
            product.stock = numStock;
        }
        if (category !== undefined) product.category = category;

        product.sizes = parsedSizes;
        product.tags = parsedTags;
        if (bestSeller !== undefined) product.bestSeller = bestSeller === 'true' || bestSeller === true;
        if (discount !== undefined) product.discount = parseFloat(discount) || 0;
        if (uploadedImages.length > 0) {
            product.images = [...product.images, ...uploadedImages];
        }

        await product.save();
        return res.status(200).json({ success: true, message: 'Product updated successfully', product });
    } catch (error) {
        console.error('Update product error:', error);
        return res.status(500).json({ success: false, message: `Server error: ${error.message}` });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        return res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};