import React, { useState, useMemo } from 'react';
import { Product, Order, Entity, Category, CustomerDetails } from '../types';
import ShoppingCartIcon from './icons/ShoppingCartIcon';
import TrashIcon from './icons/TrashIcon';
import CheckoutModal from './CheckoutModal';
import Logo from './icons/Logo';

interface PublicStoreProps {
  entity: Entity;
  products: Product[];
  categories: Category[];
  onCheckout: (order: Omit<Order, 'id' | 'orderDate' | 'status' | 'entityId'>) => void;
}

type CartItem = {
  productId: string;
  quantity: number;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
};

const StarRating = ({ rating }: { rating: number }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(
            <svg key={i} className={`w-4 h-4 ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.448a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.368-2.448a1 1 0 00-1.175 0l-3.368-2.448c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
            </svg>
        );
    }
    return <div className="flex items-center">{stars}</div>;
};

const PublicStore: React.FC<PublicStoreProps> = ({ entity, products, categories, onCheckout }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [addedToCartMessage, setAddedToCartMessage] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => p.isPublished && p.quantity > 0)
      .filter(p => {
        const searchLower = searchTerm.toLowerCase();
        const searchMatch = !searchTerm || 
            p.name.toLowerCase().includes(searchLower) || 
            (p.sku && p.sku.toLowerCase().includes(searchLower));

        const categoryMatch = !selectedCategory || p.categoryId === selectedCategory;

        const price = p.storePrice || 0;
        const minPriceNum = parseFloat(minPrice);
        const maxPriceNum = parseFloat(maxPrice);
        const minPriceMatch = !minPrice || isNaN(minPriceNum) || price >= minPriceNum;
        const maxPriceMatch = !maxPrice || isNaN(maxPriceNum) || price <= maxPriceNum;
        
        return searchMatch && categoryMatch && minPriceMatch && maxPriceMatch;
    });
  }, [searchTerm, selectedCategory, minPrice, maxPrice, products]);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  
  const formatCurrency = (value: number) => `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  const showAddedToCartMessage = (productName: string) => {
    setAddedToCartMessage(`'${productName}' fue añadido al carrito.`);
    setTimeout(() => setAddedToCartMessage(null), 2000);
  };

  const addToCart = (product: Product) => {
    const price = product.storePrice || product.price;
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        const newQty = Math.min(product.quantity, existing.quantity + 1);
        return prev.map(item => item.productId === product.id ? { ...item, quantity: newQty } : item);
      }
      return [...prev, { productId: product.id, quantity: 1, name: product.name, price, stock: product.quantity, imageUrl: product.imageUrl }];
    });
    showAddedToCartMessage(product.name);
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    setCart(prev => {
      const item = prev.find(i => i.productId === productId);
      if (!item) return prev;
      const updatedQty = Math.max(1, Math.min(item.stock, newQuantity));
      return prev.map(i => i.productId === productId ? { ...i, quantity: updatedQty } : i);
    });
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(item => item.productId !== productId));

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsCartOpen(false);
    setIsCheckoutModalOpen(true);
  };
  
  const handleConfirmCheckout = (customerDetails: CustomerDetails) => {
    const adminUser = { id: `admin_${entity.id}` };
    onCheckout({ userId: adminUser.id, items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })), total: cartTotal, customerDetails });
    setCart([]);
    setIsCheckoutModalOpen(false);
    setOrderComplete(true);
  };

  if (orderComplete) {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-lg">
                 <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h1 className="text-3xl font-bold text-gray-800">¡Pedido Realizado con Éxito!</h1>
                <p className="text-gray-600 mt-2">Gracias por su compra en {entity.name}. Su pedido ha sido recibido y será procesado a la brevedad.</p>
                <p className="text-gray-600 mt-2">Nos pondremos en contacto con usted para coordinar los detalles de la entrega.</p>
                <button onClick={() => setOrderComplete(false)} className="mt-6 bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700">
                    Realizar otro pedido
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="relative h-48 md:h-64 rounded-lg overflow-hidden mb-6 -mt-2">
            <img src={entity.storeCoverUrl || 'https://picsum.photos/seed/coverA/1200/400'} alt={`${entity.name} cover`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
             <div className="absolute bottom-0 left-0 p-6 flex items-end">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white bg-white shadow-lg">
                    <img src={entity.storeLogoUrl || 'https://picsum.photos/seed/logoA/200/200'} alt={`${entity.name} logo`} className="w-full h-full object-cover" />
                </div>
                 <h1 className="text-3xl md:text-5xl font-bold text-white ml-4" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.6)'}}>{entity.name}</h1>
            </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 space-y-4">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
             <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white">
                <option value="">Todas las categorías</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
             <input type="number" placeholder="Precio Mín." value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" min="0"/>
             <input type="number" placeholder="Precio Máx." value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500" min="0"/>
             <button onClick={() => { setSearchTerm(''); setSelectedCategory(''); setMinPrice(''); setMaxPrice(''); }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">Limpiar</button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredProducts.map(p => (
            <div key={p.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col transform hover:-translate-y-1 transition-transform duration-300">
              <img src={p.imageUrl} alt={p.name} className="w-full h-48 object-cover" />
              <div className="p-4 flex-grow flex flex-col">
                <h2 className="text-base font-semibold text-gray-800 flex-grow">{p.name}</h2>
                {p.rating && <StarRating rating={p.rating} />}
                <p className="text-lg font-bold text-teal-600 mt-2">{formatCurrency(p.storePrice || 0)}</p>
                <button onClick={() => addToCart(p)} className="mt-4 w-full bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 transition-colors">Añadir al carrito</button>
              </div>
            </div>
          ))}
           {filteredProducts.length === 0 && <div className="col-span-full text-center py-10 text-gray-500"><p>No se encontraron productos.</p></div>}
        </div>
      </div>
      
      {/* Floating Cart Button */}
      <button onClick={() => setIsCartOpen(true)} className="fixed bottom-6 right-6 bg-teal-600 text-white p-4 rounded-full shadow-lg hover:bg-teal-700 transition-transform hover:scale-110" aria-label={`Ver carrito con ${cartItemCount} artículos`}>
        <ShoppingCartIcon className="h-7 w-7" />
        {cartItemCount > 0 && <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold">{cartItemCount}</span>}
      </button>

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-md flex flex-col h-full shadow-xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800">Carrito</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
            </div>
            <div className="flex-grow overflow-y-auto p-4">
              {cart.length === 0 ? <p className="text-gray-500 text-center py-10">Tu carrito está vacío.</p> : (
                <ul className="divide-y divide-gray-200">
                  {cart.map(item => (
                    <li key={item.productId} className="flex items-center py-4">
                      <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                      <div className="ml-4 flex-grow"><p className="font-semibold text-gray-800 text-sm">{item.name}</p><p className="text-sm text-gray-600">{formatCurrency(item.price)}</p></div>
                      <div className="flex items-center">
                        <input type="number" value={item.quantity} onChange={e => updateCartQuantity(item.productId, parseInt(e.target.value))} className="w-16 text-center border border-gray-300 rounded-md py-1" min="1" max={item.stock} />
                        <button onClick={() => removeFromCart(item.productId)} className="ml-2 text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between items-center mb-4"><span className="text-lg font-semibold text-gray-800">Total:</span><span className="text-2xl font-bold text-teal-600">{formatCurrency(cartTotal)}</span></div>
              <button onClick={handleCheckout} disabled={cart.length === 0} className="w-full bg-teal-600 text-white py-3 rounded-md text-lg font-semibold hover:bg-teal-700 disabled:bg-gray-300">Finalizar Compra</button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      <CheckoutModal isOpen={isCheckoutModalOpen} onClose={() => setIsCheckoutModalOpen(false)} onConfirm={handleConfirmCheckout} cart={cart} total={cartTotal} formatCurrency={formatCurrency}/>

      {/* Toast Notification */}
      {addedToCartMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white py-3 px-5 rounded-lg shadow-lg z-50">
            {addedToCartMessage}
        </div>
      )}
    </div>
  );
};

export default PublicStore;