

import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Orders from './components/Orders';
import Users from './components/Users';
import Login from './components/Login';
import Locations from './components/Locations';
import CreateOrder from './components/CreateOrder';
import OrderDetails from './components/OrderDetails';
import Entities from './components/Entities';
import Profile from './components/Profile';
import PasswordChangeModal from './components/PasswordChangeModal';
import Reports from './components/Reports';
import EntitySettings from './components/EntitySettings';
import EncryptionPasswordModal from './components/EncryptionPasswordModal';
import ActivityLog from './components/ActivityLog';
import SuperAdminActivityLog from './components/SuperAdminActivityLog';
import SuperUserActivityLog from './components/SuperUserActivityLog';
import Store from './components/Store';
import WarehouseHeatmap from './components/WarehouseHeatmap';
import SupplierDashboard from './components/SupplierDashboard';
import PublicStore from './components/PublicStore';
import StoreNotFound from './components/StoreNotFound';
import { User, UserRole, WarehouseStructure, Currency, Product, Order, OrderStatus, View, Entity, EntityType, Notification, EntityExportData, AuditLogEntry, Category, Supplier } from './types';
import { MOCK_USERS, WAREHOUSE_STRUCTURE, MOCK_PRODUCTS, MOCK_ORDERS, MOCK_ENTITIES, MOCK_AUDIT_LOGS, MOCK_CATEGORIES, MOCK_SUPPLIERS } from './constants';
import { encryptData, decryptData } from './cryptoUtils';


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  // Master data store
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [entities, setEntities] = useState<Entity[]>(MOCK_ENTITIES);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(MOCK_AUDIT_LOGS);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);

  // App state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [warehouseStructure, setWarehouseStructure] = useState<WarehouseStructure>(WAREHOUSE_STRUCTURE);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCurrency, setCurrentCurrency] = useState<Currency>('USD');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewingEntityId, setViewingEntityId] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // State for encryption flow
  const [passwordModalConfig, setPasswordModalConfig] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      buttonText: string;
      onConfirm: (password: string) => void;
  }>({
      isOpen: false,
      title: '',
      message: '',
      buttonText: '',
      onConfirm: () => {},
  });
  
  const publicStoreEntity = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const storeSlug = params.get('store');
    if (!storeSlug) return null;
    
    return entities.find(e => e.storeSlug === storeSlug);
  }, [entities]);

  const addNotification = (message: string, target: 'admins_almaceneros' | string, entityId: string | null) => {
      if (!entityId) return; // Can't target notifications without an entity context
      const newNotification: Notification = {
          id: `notif_${Date.now()}`,
          message,
          timestamp: new Date().toISOString(),
          read: false,
          target,
          entityId,
      };
      setNotifications(prev => [newNotification, ...prev]);
  };

  const activeEntityId = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.SuperUsuario) {
        return viewingEntityId;
    }
    return currentUser.entityId;
  }, [currentUser, viewingEntityId]);

  const addAuditLogEntry = (action: string, affectedEntityId?: string) => {
    if (!currentUser && !publicStoreEntity) return;
    
    const logEntityId = activeEntityId || affectedEntityId || publicStoreEntity?.id;
    const actorId = currentUser?.id || 'public_store_user';

    if (!logEntityId) {
        console.warn("Audit log skipped: No entity context provided.");
        return;
    }

    const newLogEntry: AuditLogEntry = {
      id: `log_${Date.now()}`,
      entityId: logEntityId,
      userId: actorId,
      timestamp: new Date().toISOString(),
      action: action,
    };
    setAuditLogs(prev => [newLogEntry, ...prev]);
  };

  const handleLogin = (email: string, password_raw: string): boolean => {
    const user = users.find(u => u.email === email && u.password === password_raw);
    if (user) {
      setCurrentUser(user);
      if (user.role !== UserRole.SuperAdmin && user.role !== UserRole.SuperUsuario) {
          setViewingEntityId(user.entityId);
      } else {
          setCurrentView('entities');
      }
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setViewingEntityId(null);
    setCurrentView('dashboard');
  };

  const activeEntity = useMemo(() => entities.find(e => e.id === activeEntityId), [entities, activeEntityId]);
  
  const entityProducts = useMemo(() => products.filter(p => p.entityId === activeEntityId), [products, activeEntityId]);
  const entityOrders = useMemo(() => orders.filter(o => o.entityId === activeEntityId), [orders, activeEntityId]);
  const entityUsers = useMemo(() => users.filter(u => u.entityId === activeEntityId), [users, activeEntityId]);
  const entityAuditLogs = useMemo(() => auditLogs.filter(log => log.entityId === activeEntityId), [auditLogs, activeEntityId]);
  const entityCategories = useMemo(() => categories.filter(c => c.entityId === activeEntityId), [categories, activeEntityId]);
  const entitySuppliers = useMemo(() => suppliers.filter(s => s.entityId === activeEntityId), [suppliers, activeEntityId]);

  const isEffectivelyAdmin = useMemo(() => {
      if (!currentUser) return false;
      return currentUser.role === UserRole.Admin || ( (currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.SuperUsuario) && !!viewingEntityId);
  }, [currentUser, viewingEntityId]);
  
  const handleUpdateWarehouseStructure = (newStructure: WarehouseStructure) => {
    setWarehouseStructure(newStructure);
    addAuditLogEntry(`Modificó la estructura del almacén.`);
  };

  const handleAddOrUpdateProducts = (productsData: (Omit<Product, 'id' | 'addedDate'> | Product)[]) => {
      setProducts(prevProducts => {
          const updatedProducts = [...prevProducts];
          let updatedCount = 0;
          let createdCount = 0;
          let firstNewName = '';

          productsData.forEach(pData => {
              if ('id' in pData) {
                  // Update
                  const index = updatedProducts.findIndex(p => p.id === pData.id);
                  if (index !== -1) {
                      const oldProduct = updatedProducts[index];
                      const newProduct = pData as Product;
                      updatedProducts[index] = newProduct;

                       if (newProduct.reorderPoint && newProduct.quantity <= newProduct.reorderPoint && oldProduct.quantity > newProduct.reorderPoint) {
                          addNotification(`Stock bajo para el producto: "${newProduct.name}".`, 'admins_almaceneros', newProduct.entityId);
                       }
                      updatedCount++;
                  }
              } else {
                  // Add
                  const newProduct: Product = {
                      ...pData,
                      id: `prod_${Date.now()}_${Math.random()}`,
                      addedDate: new Date().toISOString(),
                  };
                  updatedProducts.push(newProduct);
                  createdCount++;
                  if (!firstNewName) firstNewName = newProduct.name;
              }
          });

          if(updatedCount === 1 && productsData.length === 1) {
              addAuditLogEntry(`Actualizó los detalles del producto "${productsData[0].name}".`);
          } else if (updatedCount > 0) {
              addAuditLogEntry(`Actualizó ${updatedCount} productos.`);
          }

          if(createdCount === 1) {
              addAuditLogEntry(`Creó el nuevo producto "${firstNewName}".`);
          } else if (createdCount > 1) {
              addAuditLogEntry(`Creó ${createdCount} nuevos productos serializados basados en "${firstNewName}".`);
          }

          return updatedProducts;
      });
  };

  // FIX: The type for `orderData` should omit `entityId` as it is supplied as a separate argument.
  const handleAddOrder = (orderData: Omit<Order, 'id' | 'orderDate' | 'status' | 'entityId'>, entityIdForOrder: string) => {
    const newOrder: Order = {
        ...orderData,
        id: `ORD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`,
        entityId: entityIdForOrder,
        orderDate: new Date().toISOString(),
        status: OrderStatus.Pending,
    };
    setOrders(prev => [...prev, newOrder]);
    
    setProducts(prevProducts => {
        const updatedProducts = [...prevProducts];
        newOrder.items.forEach(item => {
            const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) {
                const product = updatedProducts[productIndex];
                const oldQuantity = product.quantity;
                const newQuantity = oldQuantity - item.quantity;
                updatedProducts[productIndex] = { ...product, quantity: newQuantity };

                if (product.reorderPoint && newQuantity <= product.reorderPoint && oldQuantity > product.reorderPoint) {
                    addNotification(`Stock bajo para el producto: "${product.name}".`, 'admins_almaceneros', product.entityId);
                }
            }
        });
        return updatedProducts;
    });

    const auditMessage = orderData.customerDetails 
      ? `Se creó el pedido de tienda ${newOrder.id} para ${orderData.customerDetails.name} por un total de ${newOrder.total}.`
      : `Creó el pedido interno ${newOrder.id} por un total de ${newOrder.total}.`;

    addAuditLogEntry(auditMessage, entityIdForOrder);
    addNotification(`Nuevo pedido (${newOrder.id}) de la tienda recibido.`, 'admins_almaceneros', entityIdForOrder);
    
    if (currentUser) {
        setCurrentView('orders');
    }
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
      setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      addAuditLogEntry(`Actualizó el estado del pedido ${updatedOrder.id} a ${updatedOrder.status}.`);
      if(updatedOrder.status === OrderStatus.Delivered) {
          addNotification(`El pedido ${updatedOrder.id} ha sido entregado.`, updatedOrder.userId, updatedOrder.entityId);
      }
  };

  const handleCancelOrder = (orderId: string) => {
    const orderToCancel = orders.find(o => o.id === orderId);
    if (!orderToCancel) return;

    // Return stock
    setProducts(prevProducts => {
        const updatedProducts = [...prevProducts];
        orderToCancel.items.forEach(item => {
            const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
            if(productIndex !== -1 && orderToCancel.status !== OrderStatus.Cancelled){
                updatedProducts[productIndex].quantity += item.quantity;
            }
        });
        return updatedProducts;
    });

    setOrders(orders.map(o => o.id === orderId ? { ...o, status: OrderStatus.Cancelled } : o));
    addAuditLogEntry(`Canceló el pedido ${orderId}.`);
  };
  
  const handleAddUser = (userData: Omit<User, 'id' | 'avatarUrl' | 'entityId'>) => {
      if (!activeEntityId) return;
      const newUser: User = {
          ...userData,
          id: `user_${Date.now()}`,
          entityId: activeEntityId,
          avatarUrl: `https://i.pravatar.cc/150?u=${Date.now()}`,
      };
      setUsers(prev => [...prev, newUser]);
      addAuditLogEntry(`Añadió al nuevo usuario "${newUser.name}" con el rol de ${newUser.role}.`);
  };

  const handleUpdateUser = (updatedUser: User) => {
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      addAuditLogEntry(`Actualizó el perfil del usuario "${updatedUser.name}".`);
  };
  
  const handleDeleteUser = (userId: string) => {
      const userToDelete = users.find(u => u.id === userId);
      if (!userToDelete) return;

      // Delete user's orders as well
      setOrders(prevOrders => prevOrders.filter(o => o.userId !== userId));
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      addAuditLogEntry(`Eliminó al usuario "${userToDelete.name}".`);
  };

  const handleUpdateProfile = (updatedUser: User) => {
      setCurrentUser(updatedUser);
      handleUpdateUser(updatedUser);
  };
  
  const handleChangePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    if (!currentUser || currentUser.password !== oldPassword) {
        return false;
    }
    const updatedUser = { ...currentUser, password: newPassword };
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    addAuditLogEntry(`Cambió su contraseña.`);
    return true;
  };
  
  const handleAddEntity = (entityData: Omit<Entity, 'id'>, adminUser: Omit<User, 'id' | 'avatarUrl' | 'entityId' | 'role'>) => {
    const newEntityId = `ent_${Date.now()}`;
    const newEntity: Entity = {
        ...entityData,
        id: newEntityId,
    };
    const newAdmin: User = {
        ...adminUser,
        id: `user_admin_${Date.now()}`,
        entityId: newEntityId,
        role: UserRole.Admin,
        avatarUrl: `https://i.pravatar.cc/150?u=admin_${Date.now()}`,
    };

    setEntities(prev => [...prev, newEntity]);
    setUsers(prev => [...prev, newAdmin]);
    addAuditLogEntry(`Creó la nueva entidad "${newEntity.name}" y su administrador "${newAdmin.name}".`, newEntity.id);
  };

  const handleUpdateEntity = (updatedEntity: Entity) => {
    setEntities(entities.map(e => e.id === updatedEntity.id ? updatedEntity : e));
    addAuditLogEntry(`Actualizó los datos de la entidad "${updatedEntity.name}".`);
  };
  
  const handleDeleteEntity = (entityId: string) => {
      const entityName = entities.find(e => e.id === entityId)?.name || 'desconocida';
      setEntities(prev => prev.filter(e => e.id !== entityId));
      setUsers(prev => prev.filter(u => u.entityId !== entityId));
      setProducts(prev => prev.filter(p => p.entityId !== entityId));
      setOrders(prev => prev.filter(o => o.entityId !== entityId));
      setCategories(prev => prev.filter(c => c.entityId !== entityId));
      setSuppliers(prev => prev.filter(s => s.entityId !== entityId));
      addAuditLogEntry(`Eliminó la entidad "${entityName}" y todos sus datos asociados.`);
  };

  const handleRenameStructureItem = (type: 'type' | 'section' | 'row', path: string[], newName: string) => {
      const [typeName, sectionName, rowName] = path;
      const oldName = path[path.length - 1];
      let newStructure = JSON.parse(JSON.stringify(warehouseStructure));
      
      if (type === 'type') {
          // Rename key in object
          newStructure[newName] = newStructure[typeName];
          delete newStructure[typeName];
      } else if (type === 'section') {
          newStructure[typeName][newName] = newStructure[typeName][sectionName];
          delete newStructure[typeName][sectionName];
      } else if (type === 'row') {
          const rowIndex = newStructure[typeName][sectionName].indexOf(rowName);
          if (rowIndex > -1) {
              newStructure[typeName][sectionName][rowIndex] = newName;
          }
      }

      setWarehouseStructure(newStructure);

      // Update products using the renamed location
      setProducts(prevProducts => prevProducts.map(p => {
          let updated = false;
          if (type === 'type' && p.location.warehouseType === oldName) {
              p.location.warehouseType = newName;
              updated = true;
          } else if (type === 'section' && p.location.warehouseType === typeName && p.location.section === oldName) {
              p.location.section = newName;
              updated = true;
          } else if (type === 'row' && p.location.warehouseType === typeName && p.location.section === sectionName && p.location.row === oldName) {
              p.location.row = newName;
              updated = true;
          }
          return p;
      }));
      
      addAuditLogEntry(`Renombró la ubicación de almacén de "${oldName}" a "${newName}".`);
  };

  const handleDeleteStructureItem = (type: 'type' | 'section' | 'row', path: string[]) => {
    setWarehouseStructure(prevStructure => {
      const newStructure = JSON.parse(JSON.stringify(prevStructure));
      const [typeName, sectionName] = path;
      const itemName = path[path.length - 1];

      if (type === 'type') {
        delete newStructure[typeName];
        addAuditLogEntry(`Eliminó el tipo de almacén "${itemName}".`);
      } else if (type === 'section') {
        delete newStructure[typeName][sectionName];
        addAuditLogEntry(`Eliminó la sección "${itemName}" del almacén "${typeName}".`);
      } else if (type === 'row') {
        const rowName = path[2];
        const rowIndex = newStructure[typeName][sectionName].indexOf(rowName);
        if (rowIndex > -1) {
          newStructure[typeName][sectionName].splice(rowIndex, 1);
        }
        addAuditLogEntry(`Eliminó la fila "${itemName}" de la sección "${sectionName}" en el almacén "${typeName}".`);
      }
      
      return newStructure;
    });
  };
  
  const handleExportEntity = async (entityId: string) => {
    const entityToExport = entities.find(e => e.id === entityId);
    if (!entityToExport) return;

    const exportData: EntityExportData = {
        entity: entityToExport,
        users: users.filter(u => u.entityId === entityId),
        products: products.filter(p => p.entityId === entityId),
        orders: orders.filter(o => o.entityId === entityId),
    };
    
    setPasswordModalConfig({
        isOpen: true,
        title: 'Proteger Exportación',
        message: 'Por favor, introduzca una contraseña para cifrar este archivo de exportación. Necesitará esta contraseña para importarlo de nuevo.',
        buttonText: 'Cifrar y Descargar',
        onConfirm: async (password) => {
            try {
                const encryptedData = await encryptData(exportData, password);
                const blob = new Blob([encryptedData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${entityToExport.name}_backup_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                addAuditLogEntry(`Exportó los datos de la entidad "${entityToExport.name}".`, entityToExport.id);
            } catch (error) {
                console.error("Encryption failed", error);
                alert("Error al cifrar los datos.");
            } finally {
                setPasswordModalConfig(prev => ({ ...prev, isOpen: false }));
            }
        },
    });
  };

  const handleImportEntity = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          const content = e.target?.result as string;
          setPasswordModalConfig({
              isOpen: true,
              title: 'Descifrar e Importar',
              message: 'Introduzca la contraseña del archivo de exportación para descifrar e importar los datos.',
              buttonText: 'Descifrar e Importar',
              onConfirm: async (password) => {
                  try {
                      const decryptedData = await decryptData<EntityExportData>(content, password);
                      
                      const { entity, users: newUsers, products: newProducts, orders: newOrders } = decryptedData;

                      // Prevent ID collisions by creating a new entity ID
                      const oldEntityId = entity.id;
                      const newEntityId = `ent_${Date.now()}`;
                      entity.id = newEntityId;
                      
                      const mapUser = (u: User) => ({ ...u, entityId: newEntityId, id: u.id.includes('user_admin') ? `user_admin_${Date.now()}`: `user_${Date.now()}_${Math.random()}` });
                      const mapProduct = (p: Product) => ({ ...p, entityId: newEntityId, id: `prod_${Date.now()}_${Math.random()}` });
                      const mapOrder = (o: Order) => ({ ...o, entityId: newEntityId, id: `ORD-${new Date().getFullYear()}-${String(orders.length + 1 + Math.random()).padStart(3, '0')}` });

                      const mappedUsers = newUsers.map(mapUser);
                      const mappedProducts = newProducts.map(mapProduct);
                      
                      // Remap order user and product IDs
                      const mappedOrders = newOrders.map(order => {
                          const newItems = order.items.map(item => {
                              const oldProductIndex = newProducts.findIndex(p => p.id === item.productId);
                              const newProductId = oldProductIndex !== -1 ? mappedProducts[oldProductIndex].id : '';
                              return { ...item, productId: newProductId };
                          });
                          const oldUserIndex = newUsers.findIndex(u => u.id === order.userId);
                          const newUserId = oldUserIndex !== -1 ? mappedUsers[oldUserIndex].id : '';
                          return { ...mapOrder(order), items: newItems, userId: newUserId };
                      });

                      setEntities(prev => [...prev, entity]);
                      setUsers(prev => [...prev, ...mappedUsers]);
                      setProducts(prev => [...prev, ...mappedProducts]);
                      setOrders(prev => [...prev, ...mappedOrders]);

                      addAuditLogEntry(`Importó y creó la nueva entidad "${entity.name}" desde un archivo.`, entity.id);
                  } catch (error) {
                      console.error("Decryption/Import failed", error);
                      alert("Error: Contraseña incorrecta o archivo corrupto.");
                  } finally {
                      setPasswordModalConfig(prev => ({ ...prev, isOpen: false }));
                  }
              }
          });
      };
      reader.readAsText(file);
  };
  
  const handleImportEntityData = (file: File) => {
    if (!activeEntity) return;
    const currentEntityId = activeEntity.id;
    const currentEntityName = activeEntity.name;

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target?.result as string;
        setPasswordModalConfig({
            isOpen: true,
            title: 'Descifrar e Importar Datos',
            message: `Introduzca la contraseña para reemplazar los datos de "${currentEntityName}".`,
            buttonText: 'Confirmar Reemplazo',
            onConfirm: async (password) => {
                try {
                    const decryptedData = await decryptData<EntityExportData>(content, password);
                    
                    const { users: newUsers, products: newProducts, orders: newOrders } = decryptedData;

                    // Remove all old data for this entity
                    setUsers(prev => prev.filter(u => u.entityId !== currentEntityId));
                    setProducts(prev => prev.filter(p => p.entityId !== currentEntityId));
                    setOrders(prev => prev.filter(o => o.entityId !== currentEntityId));
                    
                    // Add new data, remapping to the current entity ID
                    const remappedUsers = newUsers.map(u => ({ ...u, entityId: currentEntityId }));
                    const remappedProducts = newProducts.map(p => ({ ...p, entityId: currentEntityId }));
                    const remappedOrders = newOrders.map(o => ({ ...o, entityId: currentEntityId }));

                    setUsers(prev => [...prev, ...remappedUsers]);
                    setProducts(prev => [...prev, ...remappedProducts]);
                    setOrders(prev => [...prev, ...remappedOrders]);

                    addAuditLogEntry(`Reemplazó todos los datos de la entidad "${currentEntityName}" desde un archivo de importación.`);
                } catch (error) {
                    console.error("Import failed", error);
                    alert("Error: Contraseña incorrecta o archivo corrupto.");
                } finally {
                    setPasswordModalConfig(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };
    reader.readAsText(file);
  };
  
    const handleAddOrUpdateCategory = (categoryData: Omit<Category, 'id' | 'entityId'> | Category) => {
        if (!activeEntityId) return;
        setCategories(prev => {
            const updated = [...prev];
            if ('id' in categoryData) { // Update
                const index = updated.findIndex(c => c.id === categoryData.id);
                if (index > -1) {
                    updated[index] = categoryData as Category;
                    addAuditLogEntry(`Actualizó la categoría "${categoryData.name}".`);
                }
            } else { // Add
                const newCategory: Category = { ...categoryData, id: `cat_${Date.now()}`, entityId: activeEntityId };
                updated.push(newCategory);
                addAuditLogEntry(`Añadió la nueva categoría "${newCategory.name}".`);
            }
            return updated;
        });
    };

    const handleDeleteCategory = (categoryId: string): boolean => {
        const categoryToDelete = categories.find(c => c.id === categoryId);
        if (!categoryToDelete) return false;

        const isCategoryInUse = products.some(p => p.categoryId === categoryId);
        if (isCategoryInUse) {
            return false; // Let component handle UI feedback
        }
        setCategories(prev => prev.filter(c => c.id !== categoryId));
        addAuditLogEntry(`Eliminó la categoría "${categoryToDelete.name}".`);
        return true;
    };

    const handleAddOrUpdateSupplier = (supplierData: Omit<Supplier, 'id' | 'entityId'> | Supplier) => {
        if (!activeEntityId) return;
        setSuppliers(prev => {
            const updated = [...prev];
            if ('id' in supplierData) { // Update
                const index = updated.findIndex(s => s.id === supplierData.id);
                if (index > -1) {
                    updated[index] = supplierData as Supplier;
                    addAuditLogEntry(`Actualizó el proveedor "${supplierData.name}".`);
                }
            } else { // Add
                const newSupplier: Supplier = { ...supplierData, id: `sup_${Date.now()}`, entityId: activeEntityId };
                updated.push(newSupplier);
                addAuditLogEntry(`Añadió el nuevo proveedor "${newSupplier.name}".`);
            }
            return updated;
        });
    };

    const handleDeleteSupplier = (supplierId: string): boolean => {
        const supplierToDelete = suppliers.find(s => s.id === supplierId);
        if (!supplierToDelete) return false;

        const isSupplierInUse = products.some(p => p.supplierId === supplierId);
        if (isSupplierInUse) {
            return false;
        }
        setSuppliers(prev => prev.filter(s => s.id !== supplierId));
        addAuditLogEntry(`Eliminó el proveedor "${supplierToDelete.name}".`);
        return true;
    };

  const renderCurrentView = () => {
    // This function should only be called for authenticated users.
    // Adding this guard to prevent crashes if the routing logic unexpectedly calls this function
    // when trying to render a public page.
    if (!currentUser) {
      return null;
    }
    // If a super user is not viewing a specific entity, show the entity management view
    if ((currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.SuperUsuario) && !viewingEntityId) {
        switch (currentView) {
            case 'entities':
                return <Entities entities={entities} onAddEntity={handleAddEntity} onUpdateEntity={handleUpdateEntity} onDeleteEntity={handleDeleteEntity} onExportEntity={handleExportEntity} onImportEntity={handleImportEntity} />;
            case 'super-admin-activity-log':
                return <SuperAdminActivityLog logs={auditLogs} users={users} entities={entities} />;
            case 'super-user-activity-log':
                return <SuperUserActivityLog logs={auditLogs} users={users} entities={entities} />;
            case 'users': // Super User's special "Supervision" view
                 return <Users users={users.filter(u => u.role === UserRole.SuperAdmin)} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} currentUser={currentUser} />;
            case 'profile':
                return <Profile currentUser={currentUser} onUpdateProfile={handleUpdateProfile} onBack={() => setCurrentView('entities')} />;
            default:
                return <Entities entities={entities} onAddEntity={handleAddEntity} onUpdateEntity={handleUpdateEntity} onDeleteEntity={handleDeleteEntity} onExportEntity={handleExportEntity} onImportEntity={handleImportEntity} />;
        }
    }
    
    if (!activeEntity) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-semibold text-gray-700">Seleccione una entidad para continuar.</h2>
                <p className="text-gray-500">Por favor, use el menú desplegable en la cabecera para elegir la entidad que desea gestionar.</p>
            </div>
        );
    }
    
    switch (currentView) {
      case 'dashboard':
        return <Dashboard products={entityProducts} orders={entityOrders} users={entityUsers} currentUser={currentUser} currentCurrency={currentCurrency} exchangeRate={activeEntity.exchangeRate} onCurrencyChange={setCurrentCurrency} onRateChange={(rate) => handleUpdateEntity({...activeEntity, exchangeRate: rate})} />;
      case 'inventory':
        return <Inventory products={entityProducts} onAddOrUpdateProducts={handleAddOrUpdateProducts} warehouseStructure={warehouseStructure} searchQuery={searchQuery} currentUser={currentUser} currentEntityId={activeEntity.id} currentCurrency={currentCurrency} exchangeRate={activeEntity.exchangeRate} onCurrencyChange={setCurrentCurrency} onRateChange={(rate) => handleUpdateEntity({...activeEntity, exchangeRate: rate})} activeEntity={activeEntity} categories={entityCategories} suppliers={entitySuppliers} />;
      case 'orders':
        return <Orders orders={entityOrders} users={entityUsers} onSelectOrder={(id) => { const order = entityOrders.find(o => o.id === id); setSelectedOrder(order || null); setCurrentView('orderDetails'); }} onShowCreateOrder={() => setCurrentView('createOrder')} onCancelOrder={handleCancelOrder} currentUser={currentUser} currentCurrency={currentCurrency} exchangeRate={activeEntity.exchangeRate} onCurrencyChange={setCurrentCurrency} onRateChange={(rate) => handleUpdateEntity({...activeEntity, exchangeRate: rate})} isEffectivelyAdmin={isEffectivelyAdmin} />;
      case 'users':
        return <Users users={entityUsers} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} currentUser={currentUser} />;
      case 'locations':
        return <Locations structure={warehouseStructure} products={entityProducts} onUpdateStructure={handleUpdateWarehouseStructure} onRenameItem={handleRenameStructureItem} onDeleteItem={handleDeleteStructureItem} />;
      case 'createOrder':
        return <CreateOrder products={entityProducts} currentUser={currentUser} onAddOrder={(order) => handleAddOrder(order, activeEntity.id)} onCancel={() => setCurrentView('orders')} />;
      case 'orderDetails':
        if (selectedOrder) {
          return <OrderDetails order={selectedOrder} products={entityProducts} users={entityUsers} currentUser={currentUser} onUpdateOrder={handleUpdateOrder} onBack={() => setCurrentView('orders')} currentCurrency={currentCurrency} exchangeRate={activeEntity.exchangeRate} isEffectivelyAdmin={isEffectivelyAdmin}/>;
        }
        return null;
      case 'profile':
        return <Profile currentUser={currentUser} onUpdateProfile={handleUpdateProfile} onBack={() => setCurrentView('dashboard')} />;
      case 'reports':
          return <Reports orders={entityOrders} products={entityProducts} users={entityUsers} currentCurrency={currentCurrency} exchangeRate={activeEntity.exchangeRate} entityName={activeEntity.name} warehouseStructure={warehouseStructure} categories={entityCategories}/>
      case 'entity-settings':
          return <EntitySettings onExportEntity={() => handleExportEntity(activeEntity.id)} onImportEntityData={handleImportEntityData} activeEntity={activeEntity} onUpdateEntity={handleUpdateEntity} categories={entityCategories} suppliers={entitySuppliers} onAddOrUpdateCategory={handleAddOrUpdateCategory} onDeleteCategory={handleDeleteCategory} onAddOrUpdateSupplier={handleAddOrUpdateSupplier} onDeleteSupplier={handleDeleteSupplier} products={entityProducts} />;
      case 'activity-log':
          return <ActivityLog logs={entityAuditLogs} users={entityUsers} />;
      case 'store':
          return <Store products={entityProducts} currentUser={currentUser} onCheckout={(order) => handleAddOrder(order, activeEntity.id)} currentCurrency={currentCurrency} exchangeRate={activeEntity.exchangeRate} activeEntity={activeEntity} categories={entityCategories} />;
      case 'supplier-dashboard':
          return <SupplierDashboard products={entityProducts} suppliers={entitySuppliers} currentCurrency={currentCurrency} exchangeRate={activeEntity.exchangeRate} />;
      case 'warehouse-heatmap':
          return <WarehouseHeatmap products={entityProducts} warehouseStructure={warehouseStructure} orders={entityOrders} />;
      default:
        return <Dashboard products={entityProducts} orders={entityOrders} users={entityUsers} currentUser={currentUser} currentCurrency={currentCurrency} exchangeRate={activeEntity.exchangeRate} onCurrencyChange={setCurrentCurrency} onRateChange={(rate) => handleUpdateEntity({...activeEntity, exchangeRate: rate})} />;
    }
  };
  
  // Public Store Routing
  if (publicStoreEntity) {
    if (publicStoreEntity.isStoreEnabled) {
      const storeProducts = products.filter(p => p.entityId === publicStoreEntity.id);
      const storeCategories = categories.filter(c => c.entityId === publicStoreEntity.id);
      const storeAdmin = users.find(u => u.entityId === publicStoreEntity.id && u.role === UserRole.Admin);
      
      // A public user doesn't exist, so we pass the admin as the creator of the order.
      // The `customerDetails` field will contain the actual buyer's info.
      if (!storeAdmin) {
        return <StoreNotFound message="La tienda no tiene un administrador configurado." />;
      }
      
      return <PublicStore 
        entity={publicStoreEntity}
        products={storeProducts}
        categories={storeCategories}
        onCheckout={(order) => handleAddOrder(order, publicStoreEntity.id)}
      />;
    } else {
      return <StoreNotFound message="Esta tienda no está habilitada actualmente."/>;
    }
  }

  // Authenticated App
  if (!currentUser) {
    return <Login onLogin={handleLogin} entities={entities} />;
  }
  
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        currentUser={currentUser}
        viewingEntityId={viewingEntityId}
        activeEntity={activeEntity}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          onShowProfile={() => setCurrentView('profile')}
          onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          entities={entities}
          viewingEntityId={viewingEntityId}
          onViewingEntityChange={(id) => {
              setViewingEntityId(id);
              setCurrentView('dashboard');
          }}
          notifications={notifications.filter(n => n.entityId === activeEntityId)}
          onMarkAsRead={(id) => setNotifications(notifications.map(n => n.id === id ? {...n, read: true} : n))}
          onMarkAllAsRead={() => setNotifications(notifications.map(n => n.entityId === activeEntityId ? {...n, read: true} : n))}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {renderCurrentView()}
        </main>
      </div>
      <PasswordChangeModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSave={handleChangePassword}
      />
      <EncryptionPasswordModal 
          isOpen={passwordModalConfig.isOpen}
          onClose={() => setPasswordModalConfig(prev => ({ ...prev, isOpen: false }))}
          onConfirm={passwordModalConfig.onConfirm}
          title={passwordModalConfig.title}
// FIX: Corrected typo from `passwordModal-config.message` to `passwordModalConfig.message`
          message={passwordModalConfig.message}
          buttonText={passwordModalConfig.buttonText}
      />
    </div>
  );
};

export default App;