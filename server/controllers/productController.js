import Product from '../models/productModel.js';
import { v2 as cloudinary } from 'cloudinary';

export const createProduct = async (req, res) => {
    try {
        console.log('Create product request body:', req.body);
        console.log('Create product request files:', req.files);

        const { name, description, price, stock, category, sizes, tags, bestSeller, discount } = req.body;

        // Validate required fields
        if (!name || !description || !price || stock === undefined || !category) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const numPrice = parseFloat(price);
        const numStock = parseInt(stock);
        const numDiscount = discount ? parseFloat(discount) : 0;

        if (isNaN(numPrice) || numPrice <= 0 || isNaN(numStock) || numStock < 0) {
            return res.status(400).json({ success: false, message: 'Invalid price or stock' });
        }

        let images = [];

        if (req.files) {
            // Upload each file to Cloudinary
            for (const [key, fileArray] of Object.entries(req.files)) {
                if (fileArray && fileArray[0]) {
                    try {
                        const file = fileArray[0];
                        // Upload buffer to Cloudinary
                        const result = await new Promise((resolve, reject) => {
                            const stream = cloudinary.uploader.upload_stream(
                                {
                                    folder: 'products',
                                    public_id: `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname.split('.')[0]}`,
                                    resource_type: 'auto'
                                },
                                (error, result) => {
                                    if (error) reject(error);
                                    else resolve(result);
                                }
                            );
                            stream.end(file.buffer);
                        });
                        images.push(result.secure_url);
                    } catch (uploadError) {
                        console.error('Cloudinary upload error:', uploadError);
                        return res.status(500).json({ success: false, message: 'Failed to upload image' });
                    }
                }
            }
        }

        console.log('Uploaded images URLs:', images);

        if (images.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one image is required' });
        }

        let parsedSizes = [];
        let parsedTags = [];

        try {
            parsedSizes = sizes ? JSON.parse(sizes) : [];
            parsedTags = tags ? JSON.parse(tags) : [];
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
            images: images
        });

        console.log('Product to save:', product);

        await product.save();

        res.status(200).json({ success: true, message: 'Product created successfully', product });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ success: false, message: `Server error: ${error.message}` });
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
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({ success: true, product });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



export const updateProduct = async (req, res) => {
    try {
        console.log('Update product request params:', req.params);
        console.log('Update product request body:', req.body);
        console.log('Update product request files:', req.files);

        const { id } = req.params;
        const { name, description, price, stock, category, sizes, tags, bestSeller, discount } = req.body;

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Handle new image uploads
        let newImages = [...product.images]; // Start with existing images

        if (req.files) {
            for (const [key, fileArray] of Object.entries(req.files)) {
                if (fileArray && fileArray[0]) {
                    try {
                        const file = fileArray[0];
                        const result = await new Promise((resolve, reject) => {
                            const stream = cloudinary.uploader.upload_stream(
                                {
                                    folder: 'products',
                                    public_id: `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname.split('.')[0]}`,
                                    resource_type: 'auto'
                                },
                                (error, result) => {
                                    if (error) reject(error);
                                    else resolve(result);
                                }
                            );
                            stream.end(file.buffer);
                        });
                        newImages.push(result.secure_url);
                    } catch (uploadError) {
                        console.error('Cloudinary upload error:', uploadError);
                        return res.status(500).json({ success: false, message: 'Failed to upload image' });
                    }
                }
            }
        }

        // Parse and validate data
        let parsedSizes = product.sizes;
        let parsedTags = product.tags;

        try {
            if (sizes !== undefined) parsedSizes = JSON.parse(sizes);
            if (tags !== undefined) parsedTags = JSON.parse(tags);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return res.status(400).json({ success: false, message: 'Invalid sizes or tags format' });
        }

        // Update fields
        if (name !== undefined) product.name = name;
        if (description !== undefined) product.description = description;
        if (price !== undefined) {
            const numPrice = parseFloat(price);
            if (isNaN(numPrice) || numPrice <= 0) return res.status(400).json({ success: false, message: 'Invalid price' });
            product.price = numPrice;
        }
        if (stock !== undefined) {
            const numStock = parseInt(stock);
            if (isNaN(numStock) || numStock < 0) return res.status(400).json({ success: false, message: 'Invalid stock' });
            product.stock = numStock;
        }
        if (category !== undefined) product.category = category;
        product.sizes = parsedSizes;
        product.tags = parsedTags;
        if (bestSeller !== undefined) product.bestSeller = bestSeller === 'true' || bestSeller === true;
        if (discount !== undefined) product.discount = parseFloat(discount) || 0;
        product.images = newImages;

        await product.save();

        res.status(200).json({ success: true, message: 'Product updated successfully', product });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ success: false, message: `Server error: ${error.message}` });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};