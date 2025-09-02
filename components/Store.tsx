import React, { useState, useMemo } from 'react';
import { Product, Order, User, Currency, Entity, Category, CustomerDetails } from '../types';
import ShoppingCartIcon from './icons/ShoppingCartIcon';
import TrashIcon from './icons/TrashIcon';
import CheckoutModal from './CheckoutModal';

interface StoreProps {
  products: Product[];
  currentUser: User;
  onCheckout: (order: Omit<Order, 'id' | 'orderDate' | 'status' | 'entityId'>) => void;
  currentCurrency: Currency;
  exchangeRate: number;
  activeEntity: Entity;
  categories: Category[];
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
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.448a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.368-2.448a1 1 0 00-1.175 0l-3.368 2.448c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
            </svg>
        );
    }
    return <div className="flex items-center">{stars}</div>;
};


const Store: React.FC<StoreProps> = ({ products, currentUser, onCheckout, currentCurrency, exchangeRate, activeEntity, categories }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [addedToCartMessage, setAddedToCartMessage] = useState<string | null>(null);

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);

  const filteredProducts = useMemo(() => {
    const publishedProducts = products.filter(p => p.isPublished && p.quantity > 0);
    
    return publishedProducts.filter(p => {
        // Search term filter
        const searchLower = searchTerm.toLowerCase();
        const searchMatch = !searchTerm || 
            p.name.toLowerCase().includes(searchLower) || 
            (p.sku && p.sku.toLowerCase().includes(searchLower));

        // Price filter
        const price = p.storePrice || p.price;
        const minPriceNum = parseFloat(minPrice);
        const maxPriceNum = parseFloat(maxPrice);
        
        const minPriceMatch = !minPrice || isNaN(minPriceNum) || price >= minPriceNum;
        const maxPriceMatch = !maxPrice || isNaN(maxPriceNum) || price <= maxPriceNum;

        // Rating filter
        const ratingNum = parseInt(ratingFilter, 10);
        const ratingMatch = !ratingFilter || isNaN(ratingNum) || (p.rating && p.rating >= ratingNum);
        
        return searchMatch && minPriceMatch && maxPriceMatch && ratingMatch;
    });
  }, [searchTerm, minPrice, maxPrice, ratingFilter, products]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const formatCurrency = (priceInUSD: number) => {
    const displayValue = currentCurrency === 'USD' ? priceInUSD : priceInUSD * exchangeRate;
    const formatter = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currentCurrency,
    });
    if (currentCurrency === 'USD') return `$${displayValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return formatter.format(displayValue);
  };
  
  const showAddedToCartMessage = (productName: string) => {
    setAddedToCartMessage(`'${productName}' fue añadido al carrito.`);
    setTimeout(() => {
        setAddedToCartMessage(null);
    }, 2000);
  }

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        const newQuantity = Math.min(product.quantity, existingItem.quantity + 1);
        return prevCart.map(item => item.productId === product.id ? { ...item, quantity: newQuantity } : item);
      }
      return [...prevCart, {
        productId: product.id,
        quantity: 1,
        name: product.name,
        price: product.storePrice || product.price,
        stock: product.quantity,
        imageUrl: product.imageUrl,
      }];
    });
    showAddedToCartMessage(product.name);
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    setCart(prevCart => {
      const item = prevCart.find(i => i.productId === productId);
      if (!item) return prevCart;
      
      const updatedQuantity = Math.max(1, Math.min(item.stock, newQuantity));

      return prevCart.map(i => i.productId === productId ? { ...i, quantity: updatedQuantity } : i);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsCartOpen(false); // Close cart
    setIsCheckoutModalOpen(true); // Open checkout
  };
  
  const handleConfirmCheckout = (customerDetails: CustomerDetails) => {
    onCheckout({
      userId: currentUser.id,
      items: cart.map(({ productId, quantity }) => ({ productId, quantity })),
      total: cartTotal,
      customerDetails,
    });
    setCart([]);
    setIsCheckoutModalOpen(false);
  };

  const handleClearFilters = () => {
      setSearchTerm('');
      setMinPrice('');
      setMaxPrice('');
      setRatingFilter('');
  };

  const coverPhotoUrl = activeEntity.storeCoverUrl || 'https://via.placeholder.com/1200x400.png/E2E8F0/4A5568?text=Portada';
  const logoUrl = activeEntity.storeLogoUrl || 'https://via.placeholder.com/200x200.png/E2E8F0/4A5568?text=Logo';

  return (
    <div className="relative">
      {/* Page Header */}
      <div className="relative mb-6 -mt-6 -mx-6">
        <div className="h-48 md:h-64 bg-gray-200">
            <img src={coverPhotoUrl} alt={`${activeEntity.name} cover`} className="w-full h-full object-cover" />
        </div>
        <div className="absolute bottom-0 left-6 right-0">
            <div className="flex items-end">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-gray-100 bg-gray-100 shadow-lg -mb-4 md:-mb-6">
                    <img src={logoUrl} alt={`${activeEntity.name} logo`} className="w-full h-full object-cover" />
                </div>
                 <div className="pb-2 pl-4">
                     <h1 className="text-3xl md:text-4xl font-bold text-gray-800 ">{activeEntity.name}</h1>
                 </div>
            </div>
        </div>
         <button
          onClick={() => setIsCartOpen(true)}
          className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow hover:bg-gray-100 transition-colors"
          aria-label={`Ver carrito de compras con ${cartItemCount} artículos`}
        >
          <ShoppingCartIcon className="h-6 w-6 text-gray-700" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 pt-10 space-y-4">
        <input
          type="text"
          placeholder="Buscar por nombre o modelo..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <div className="flex flex-wrap items-end gap-4">
            <div>
                <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700">Precio Mín.</label>
                <input
                    type="number"
                    id="minPrice"
                    placeholder="0"
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value)}
                    className="mt-1 w-32 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                    min="0"
                />
            </div>
            <div>
                <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700">Precio Máx.</label>
                <input
                    type="number"
                    id="maxPrice"
                    placeholder="∞"
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                    className="mt-1 w-32 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                    min="0"
                />
            </div>
            <div>
                <label htmlFor="ratingFilter" className="block text-sm font-medium text-gray-700">Calificación</label>
                <select
                    id="ratingFilter"
                    value={ratingFilter}
                    onChange={e => setRatingFilter(e.target.value)}
                    className="mt-1 w-48 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                >
                    <option value="">Todas</option>
                    <option value="5">5 estrellas</option>
                    <option value="4">4 estrellas o más</option>
                    <option value="3">3 estrellas o más</option>
                    <option value="2">2 estrellas o más</option>
                    <option value="1">1 estrella o más</option>
                </select>
            </div>
            <button
                onClick={handleClearFilters}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
                Limpiar Filtros
            </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
            <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" />
            <div className="p-4 flex-grow flex flex-col">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{product.name}</h2>
                <p className="text-sm text-gray-500 mb-2">{categoryMap.get(product.categoryId) || 'Sin Categoría'}</p>
                {product.rating && <StarRating rating={product.rating} />}
              </div>
              <div className="flex-grow"></div>
              <div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xl font-bold text-teal-600">{formatCurrency(product.storePrice || product.price)}</p>
                  <p className={`text-sm font-medium ${product.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.quantity > 0 ? `${product.quantity} disponibles` : 'Agotado'}
                  </p>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  disabled={product.quantity === 0}
                  className="mt-4 w-full bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Añadir al carrito
                </button>
              </div>
            </div>
          </div>
        ))}
         {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-500">
                <p>No se encontraron productos que coincidan con sus criterios de búsqueda.</p>
            </div>
        )}
      </div>
      
       {/* Added to Cart Toast */}
      {addedToCartMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-800 text-white py-3 px-5 rounded-lg shadow-lg animate-fade-in-out z-50">
            <style>{`
                @keyframes fade-in-out {
                    0% { opacity: 0; transform: translateY(10px); }
                    10% { opacity: 1; transform: translateY(0); }
                    90% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(10px); }
                }
                .animate-fade-in-out {
                    animation: fade-in-out 2s ease-in-out forwards;
                }
            `}</style>
            {addedToCartMessage}
        </div>
      )}

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col" style={{ height: '90vh', maxHeight: '700px' }}>
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800">Carrito de Compras</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
            </div>
            <div className="flex-grow overflow-y-auto p-4">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-10">Tu carrito está vacío.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {cart.map(item => (
                    <li key={item.productId} className="flex items-center py-4">
                      <img src={item.imageUrl} alt={item.name} className="w-20 h-20 object-cover rounded-md" />
                      <div className="ml-4 flex-grow">
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(item.price)}</p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => updateCartQuantity(item.productId, parseInt(e.target.value))}
                          className="w-16 text-center border border-gray-300 rounded-md py-1"
                          min="1"
                          max={item.stock}
                        />
                         <button onClick={() => removeFromCart(item.productId)} className="ml-4 text-red-500 hover:text-red-700">
                           <TrashIcon className="w-5 h-5"/>
                         </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-800">Total:</span>
                <span className="text-2xl font-bold text-teal-600">{formatCurrency(cartTotal)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-teal-600 text-white py-3 rounded-md text-lg font-semibold hover:bg-teal-700 disabled:bg-gray-300"
              >
                Realizar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onConfirm={handleConfirmCheckout}
        cart={cart}
        total={cartTotal}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default Store;