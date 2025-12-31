import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import suppliersRoutes from './routes/suppliers';
import rawMaterialsRoutes from './routes/rawMaterials';
import productsRoutes from './routes/products';
import masterDataRoutes from './routes/masterData';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/raw-materials', rawMaterialsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/master-data', masterDataRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
