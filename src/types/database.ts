export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          full_name: string;
          role: 'admin' | 'staff';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: 'admin' | 'staff';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: 'admin' | 'staff';
          created_at?: string;
          updated_at?: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          contact_person: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      raw_materials: {
        Row: {
          id: string;
          code: string;
          name: string;
          unit: string;
          current_price: number;
          current_stock: number;
          min_stock: number;
          supplier_id: string | null;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          unit: string;
          current_price?: number;
          current_stock?: number;
          min_stock?: number;
          supplier_id?: string | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          unit?: string;
          current_price?: number;
          current_stock?: number;
          min_stock?: number;
          supplier_id?: string | null;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      raw_material_price_history: {
        Row: {
          id: string;
          raw_material_id: string;
          old_price: number;
          new_price: number;
          changed_by: string | null;
          changed_at: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          raw_material_id: string;
          old_price: number;
          new_price: number;
          changed_by?: string | null;
          changed_at?: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          raw_material_id?: string;
          old_price?: number;
          new_price?: number;
          changed_by?: string | null;
          changed_at?: string;
          notes?: string | null;
        };
      };
      raw_material_stock_transactions: {
        Row: {
          id: string;
          raw_material_id: string;
          quantity: number;
          type: 'in' | 'out' | 'adjustment';
          reference: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          raw_material_id: string;
          quantity: number;
          type: 'in' | 'out' | 'adjustment';
          reference?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          raw_material_id?: string;
          quantity?: number;
          type?: 'in' | 'out' | 'adjustment';
          reference?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          code: string;
          name: string;
          category: string | null;
          description: string | null;
          current_hpp: number;
          selling_price: number;
          margin_percentage: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          category?: string | null;
          description?: string | null;
          current_hpp?: number;
          selling_price?: number;
          margin_percentage?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          category?: string | null;
          description?: string | null;
          current_hpp?: number;
          selling_price?: number;
          margin_percentage?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_bom: {
        Row: {
          id: string;
          product_id: string;
          raw_material_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          raw_material_id: string;
          quantity: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          raw_material_id?: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_additional_costs: {
        Row: {
          id: string;
          product_id: string;
          cost_type: 'labor' | 'overhead' | 'packaging' | 'other';
          cost_name: string;
          amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          cost_type: 'labor' | 'overhead' | 'packaging' | 'other';
          cost_name: string;
          amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          cost_type?: 'labor' | 'overhead' | 'packaging' | 'other';
          cost_name?: string;
          amount?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_hpp_history: {
        Row: {
          id: string;
          product_id: string;
          hpp_value: number;
          material_cost: number;
          additional_cost: number;
          calculated_at: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          product_id: string;
          hpp_value: number;
          material_cost: number;
          additional_cost: number;
          calculated_at?: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string;
          hpp_value?: number;
          material_cost?: number;
          additional_cost?: number;
          calculated_at?: string;
          notes?: string | null;
        };
      };
      units: {
        Row: {
          id: string;
          name: string;
          symbol: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          symbol: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          symbol?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type Supplier = Database['public']['Tables']['suppliers']['Row'];
export type RawMaterial = Database['public']['Tables']['raw_materials']['Row'];
export type RawMaterialPriceHistory = Database['public']['Tables']['raw_material_price_history']['Row'];
export type RawMaterialStockTransaction = Database['public']['Tables']['raw_material_stock_transactions']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type ProductBom = Database['public']['Tables']['product_bom']['Row'];
export type ProductAdditionalCost = Database['public']['Tables']['product_additional_costs']['Row'];
export type ProductHppHistory = Database['public']['Tables']['product_hpp_history']['Row'];

export type RawMaterialWithSupplier = RawMaterial & {
  suppliers?: Supplier | null;
};

export type ProductBomWithMaterial = ProductBom & {
  raw_materials: RawMaterial;
};

export type ProductWithDetails = Product & {
  product_bom?: ProductBomWithMaterial[];
  product_additional_costs?: ProductAdditionalCost[];
};

export type Unit = Database['public']['Tables']['units']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
