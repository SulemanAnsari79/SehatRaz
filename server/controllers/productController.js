 
// import Product from "../models/productModel.js";

// export const addProduct = async (req, res) => {
//     try {
//         const { name, description, price, stock, category } = req.body;
//         const image1 = req.files.image1 && req.files.image1[0];
//         const image2 = req.files.image2 && req.files.image1[0];
//         const image3 = req.files.image3 && req.files.image1[0];
//         const image4 = req.files.image4 && req.files.image1[0];

//         const images = [image1, image2, image3, image4].filter((item) => item !== undefined)

//         let imagesUrl = await Promise.all(
//             images.map(async (item) => {
//                 let result = await cloudinary.uploader.upload(item.path, { resource: 'image' });
//                 return result.secure_url
//             })
//         )

//         const product = new Product({
//             name,
//             description,
//             price,
//             stock,
//             category,
//             images: imagesUrl,
//         });

//         await product.save();
//         res.status(200).json({ message: "Product added successfully", product });

//     } catch (error) {
//         res.status(500).json({ message: "Failed to create product", error: error.message });
//     }
// };

import Product from '../models/productModel.js';

export const getAllProducts = async (req, res) => {
    try {
        const { category, minPrice, maxPrice, search } = req.query;

        let query = {};

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        if (category) {
            query.category = category;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        const products = await Product.find(query).sort({ createdAt: -1 });

        res.status(200).json({ success: true, products });
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

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, images } = req.body;

        // Validate required fields
        if (!name || !description || !price || stock === undefined || !category) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        if (price <= 0 || stock < 0) {
            return res.status(400).json({ success: false, message: 'Invalid price or stock' });
        }

        const product = new Product({
            name,
            description,
            price,
            stock,
            category,
            images: images || []
        });

        await product.save();

        res.status(201).json({ success: true, message: 'Product created successfully', product });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock, category, images } = req.body;

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Update only provided fields
        if (name) product.name = name;
        if (description) product.description = description;
        if (price !== undefined) {
            if (price <= 0) return res.status(400).json({ success: false, message: 'Invalid price' });
            product.price = price;
        }
        if (stock !== undefined) {
            if (stock < 0) return res.status(400).json({ success: false, message: 'Invalid stock' });
            product.stock = stock;
        }
        if (category) product.category = category;
        if (images) product.images = images;

        await product.save();

        res.status(200).json({ success: true, message: 'Product updated successfully', product });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
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