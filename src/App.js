import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, DollarSign, ShoppingBag, Trash2, Check, Plus, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import './App.css';

const AddiDebtTracker = () => {
  const [purchases, setPurchases] = useState([]);
  const [formData, setFormData] = useState({
    store: '',
    amount: '',
    installments: '3',
    interestRate: '0',
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  const MAX_CREDIT = 4500000;

  // Cargar datos del estado interno (no usar localStorage en Claude)
  useEffect(() => {
    const installments = parseInt(formData.installments);
    setFormData(prev => ({
      ...prev,
      interestRate: installments === 3 ? '0' : '1.96'
    }));
  }, [formData.installments]);

  const addPurchase = async () => {
    if (!formData.store || !formData.amount || parseFloat(formData.amount) <= 0) {
      Swal.fire({
        title: '¡Campos incompletos!',
        text: 'Por favor completa todos los campos correctamente',
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#4CAF50'
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    const installments = parseInt(formData.installments);
    const interestRate = parseFloat(formData.interestRate) || 0;
    const purchaseDate = new Date(formData.purchaseDate);

    // Verificar si excede el crédito disponible
    if (amount > getAvailableCredit()) {
      Swal.fire({
        title: '¡Crédito insuficiente!',
        text: `El monto de ${formatCurrency(amount)} excede tu crédito disponible de ${formatCurrency(getAvailableCredit())}`,
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#FF6B6B'
      });
      return;
    }

    // Calcular valor de la cuota
    let installmentValue;
    if (interestRate === 0) {
      installmentValue = amount / installments;
    } else {
      const monthlyRate = interestRate / 100;
      installmentValue = amount * (monthlyRate * Math.pow(1 + monthlyRate, installments)) / 
                       (Math.pow(1 + monthlyRate, installments) - 1);
    }

    // Fecha del primer pago
    let firstPaymentDate = new Date(purchaseDate);
    if (installments > 3) {
      firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);
    }
    firstPaymentDate.setDate(19);

    const purchase = {
      id: Date.now(),
      store: formData.store,
      originalAmount: amount,
      installments: installments,
      installmentValue: installmentValue,
      interestRate: interestRate,
      purchaseDate: purchaseDate,
      firstPaymentDate: firstPaymentDate,
      paidInstallments: 0,
      status: 'active'
    };

    setPurchases(prev => [...prev, purchase]);
    setFormData({
      store: '',
      amount: '',
      installments: '3',
      interestRate: '0',
      purchaseDate: new Date().toISOString().split('T')[0]
    });

    // Mostrar confirmación de éxito
    Swal.fire({
      title: '¡Compra registrada!',
      text: `Se ha registrado tu compra en ${formData.store} por ${formatCurrency(amount)} en ${installments} cuotas`,
      icon: 'success',
      confirmButtonText: 'Perfecto',
      confirmButtonColor: '#4CAF50'
    });
  };

  const deletePurchase = async (id) => {
    const purchase = purchases.find(p => p.id === id);
    
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Quieres eliminar la compra de ${purchase.store} por ${formatCurrency(purchase.originalAmount)}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FF6B6B',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setPurchases(prev => prev.filter(p => p.id !== id));
      
      Swal.fire({
        title: '¡Eliminado!',
        text: 'La compra ha sido eliminada correctamente',
        icon: 'success',
        confirmButtonText: 'Perfecto',
        confirmButtonColor: '#4CAF50'
      });
    }
  };

  const payInstallment = async (id) => {
    const purchase = purchases.find(p => p.id === id);
    const remainingInstallments = purchase.installments - purchase.paidInstallments;
    
    const result = await Swal.fire({
      title: '¿Confirmar pago?',
      text: `¿Confirmas el pago de ${formatCurrency(purchase.installmentValue)} para ${purchase.store}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4CAF50',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, pagar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setPurchases(prev => prev.map(p => {
        if (p.id === id && p.paidInstallments < p.installments) {
          const newPaidInstallments = p.paidInstallments + 1;
          return {
            ...p,
            paidInstallments: newPaidInstallments,
            status: newPaidInstallments === p.installments ? 'paid' : 'active'
          };
        }
        return p;
      }));

      const newPaidInstallments = purchase.paidInstallments + 1;
      const isCompleted = newPaidInstallments === purchase.installments;
      
      if (isCompleted) {
        Swal.fire({
          title: '¡Compra completada! 🎉',
          text: `Has pagado todas las cuotas de ${purchase.store}. ¡Felicitaciones!`,
          icon: 'success',
          confirmButtonText: 'Genial',
          confirmButtonColor: '#4CAF50'
        });
      } else {
        Swal.fire({
          title: '¡Pago registrado!',
          text: `Pago de ${formatCurrency(purchase.installmentValue)} registrado. Te faltan ${remainingInstallments - 1} cuotas.`,
          icon: 'success',
          confirmButtonText: 'Perfecto',
          confirmButtonColor: '#4CAF50'
        });
      }
    }
  };

  const getTotalDebt = () => {
    return purchases.reduce((sum, p) => {
      if (p.status === 'active') {
        return sum + (p.installmentValue * (p.installments - p.paidInstallments));
      }
      return sum;
    }, 0);
  };

  const getAvailableCredit = () => {
    return MAX_CREDIT - getTotalDebt();
  };

  const getNextPaymentDate = (purchase) => {
    if (purchase.status === 'paid') return 'Completado';
    
    const paymentDate = new Date(purchase.firstPaymentDate);
    paymentDate.setMonth(paymentDate.getMonth() + purchase.paidInstallments);
    
    return paymentDate.toLocaleDateString('es-CO');
  };

  // Función mejorada para obtener pagos de los próximos meses
  const getPaymentsByMonth = () => {
    const today = new Date();
    const payments = {};

    purchases.forEach(purchase => {
      if (purchase.status === 'active') {
        for (let i = purchase.paidInstallments; i < purchase.installments; i++) {
          const paymentDate = new Date(purchase.firstPaymentDate);
          paymentDate.setMonth(paymentDate.getMonth() + i);
          
          const monthKey = `${paymentDate.getFullYear()}-${paymentDate.getMonth()}`;
          const monthName = paymentDate.toLocaleDateString('es-CO', { 
            month: 'long', 
            year: 'numeric' 
          });
          
          if (!payments[monthKey]) {
            payments[monthKey] = {
              monthName: monthName,
              date: new Date(paymentDate),
              payments: [],
              total: 0
            };
          }
          
          payments[monthKey].payments.push({
            store: purchase.store,
            amount: purchase.installmentValue,
            installmentNumber: i + 1,
            totalInstallments: purchase.installments,
            purchaseId: purchase.id
          });
          
          payments[monthKey].total += purchase.installmentValue;
        }
      }
    });

    // Convertir a array y ordenar por fecha
    return Object.values(payments)
      .sort((a, b) => a.date - b.date)
      .slice(0, 6); // Mostrar solo los próximos 6 meses
  };

  const getNextTwoMonthsPayments = () => {
    const allPayments = getPaymentsByMonth();
    return allPayments.slice(0, 2); // Solo los próximos 2 meses
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const nextTwoMonthsPayments = getNextTwoMonthsPayments();

  return (
    <div className="container">
      <div className="main-container">
        {/* Header */}
        <div className="header">
          <h1 className="header-title">
            <CreditCard size={48} color="#4CAF50" />
            Control de Deudas Addi
          </h1>
          <p className="header-subtitle">Love Like Ours Can Never</p>
        </div>

        {/* Summary Cards */}
        <div className="cards-grid">
          <div className="card card-green">
            <div>
              <p className="card-text">Crédito Disponible</p>
              <p className="card-amount">{formatCurrency(getAvailableCredit())}</p>
            </div>
            <DollarSign size={48} style={{opacity: 0.7}} />
          </div>

          <div className="card card-red">
            <div>
              <p className="card-text">Deuda Total</p>
              <p className="card-amount">{formatCurrency(getTotalDebt())}</p>
            </div>
            <AlertCircle size={48} style={{opacity: 0.7}} />
          </div>

          <div className="card card-orange">
            <div>
              <p className="card-text">Compras Activas</p>
              <p className="card-amount">{purchases.filter(p => p.status === 'active').length}</p>
            </div>
            <ShoppingBag size={48} style={{opacity: 0.7}} />
          </div>

          <div className="card card-blue">
            <div>
              <p className="card-text">Compras Pagadas</p>
              <p className="card-amount">{purchases.filter(p => p.status === 'paid').length}</p>
            </div>
            <Check size={48} style={{opacity: 0.7}} />
          </div>
        </div>

        {/* Add Purchase Form */}
        <div className="form-section">
          <h2 className="form-title">
            <Plus size={24} color="#4CAF50" />
            Registrar Nueva Compra
          </h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label className="label">Entidad/Tienda</label>
              <input
                type="text"
                value={formData.store}
                onChange={(e) => setFormData(prev => ({ ...prev, store: e.target.value }))}
                placeholder="Ej: Falabella, Éxito, etc."
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="label">Valor de la Compra</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0"
                min="0"
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="label">Número de Cuotas</label>
              <select
                value={formData.installments}
                onChange={(e) => setFormData(prev => ({ ...prev, installments: e.target.value }))}
                className="input"
              >
                <option value="3">3 cuotas (0% interés)</option>
                <option value="6">6 cuotas (1.96% interés)</option>
                <option value="9">9 cuotas (1.96% interés)</option>
                <option value="12">12 cuotas (1.96% interés)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">Tasa de Interés (%)</label>
              <input
                type="number"
                value={formData.interestRate}
                onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value }))}
                placeholder="1.96"
                step="0.01"
                min="0"
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="label">Fecha de Compra</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="label">&nbsp;</label>
              <button onClick={addPurchase} className="button">
                <Plus size={20} />
                Registrar Compra
              </button>
            </div>
          </div>
        </div>

        {/* Próximos Pagos por Meses */}
        {nextTwoMonthsPayments.length > 0 && (
          <div className="payments-grid">
            {nextTwoMonthsPayments.map((monthData, index) => (
              <div key={index} className="month-payments">
                <div className="month-header">
                  <Calendar size={24} style={{marginRight: '10px'}} />
                  {index === 0 ? 'Próximo 19: ' : 'Siguiente 19: '}
                  {capitalizeFirstLetter(monthData.monthName)}
                </div>
                <div className="month-content">
                  {monthData.payments.map((payment, paymentIndex) => (
                    <div key={paymentIndex} className="month-payment-item">
                      <div>
                        <h4 style={{margin: '0 0 5px 0', fontSize: '1.1rem', fontWeight: 'bold'}}>
                          {payment.store}
                        </h4>
                        <p style={{margin: '0', color: '#666', fontSize: '0.9rem'}}>
                          Cuota {payment.installmentNumber} de {payment.totalInstallments}
                        </p>
                      </div>
                      <div>
                        <p style={{margin: '0', fontSize: '1.3rem', fontWeight: 'bold', color: '#42A5F5'}}>
                          {formatCurrency(payment.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="month-total">
                    <span style={{fontSize: '1.1rem', fontWeight: 'bold'}}>
                      Total del mes:
                    </span>
                    <span style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#42A5F5'}}>
                      {formatCurrency(monthData.total)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mensaje cuando no hay pagos próximos */}
        {nextTwoMonthsPayments.length === 0 && (
          <div className="next-payments-section">
            <h3 className="next-payments-title">
              <Calendar size={24} />
              Próximos Pagos
            </h3>
            <div className="empty-state">
              <Calendar size={64} color="#FFA726" />
              <h3 style={{color: '#856404', marginTop: '20px'}}>
                No hay pagos pendientes para los próximos meses
              </h3>
              <p style={{color: '#B8860B'}}>
                ¡Perfecto! No tienes pagos programados
              </p>
            </div>
          </div>
        )}

        {/* Purchases Table */}
        <div className="table-container">
          <div className="table-header">
            <h2 className="table-title">
              <ShoppingBag size={24} />
              Compras Registradas
            </h2>
          </div>
          
          <div style={{overflowX: 'auto'}}>
            <table className="table">
              <thead>
                <tr>
                  <th>Tienda</th>
                  <th>Valor Original</th>
                  <th>Cuotas</th>
                  <th>Valor Cuota</th>
                  <th>Progreso</th>
                  <th>Saldo Restante</th>
                  <th>Próximo Pago</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase, index) => {
                  const remainingBalance = purchase.installmentValue * (purchase.installments - purchase.paidInstallments);
                  const progressPercentage = (purchase.paidInstallments / purchase.installments) * 100;
                  
                  return (
                    <tr key={purchase.id}>
                      <td><strong>{purchase.store}</strong></td>
                      <td>{formatCurrency(purchase.originalAmount)}</td>
                      <td>{purchase.installments}</td>
                      <td>{formatCurrency(purchase.installmentValue)}</td>
                      <td>
                        <div className="progress-container">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{width: `${progressPercentage}%`}}
                            ></div>
                          </div>
                          <span style={{fontSize: '0.8rem'}}>
                            {purchase.paidInstallments}/{purchase.installments}
                          </span>
                        </div>
                      </td>
                      <td><strong>{formatCurrency(remainingBalance)}</strong></td>
                      <td>{getNextPaymentDate(purchase)}</td>
                      <td>
                        <span className={`status-badge ${purchase.status === 'active' ? 'status-active' : 'status-paid'}`}>
                          {purchase.status === 'active' ? 'Activo' : 'Pagado'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {purchase.status === 'active' && (
                            <button
                              onClick={() => payInstallment(purchase.id)}
                              className="action-btn pay-btn"
                            >
                              <Check size={14} />
                              Pagar
                            </button>
                          )}
                          <button
                            onClick={() => deletePurchase(purchase.id)}
                            className="action-btn delete-btn"
                          >
                            <Trash2 size={14} />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {purchases.length === 0 && (
              <div className="empty-state">
                <ShoppingBag size={64} color="#ccc" />
                <h3 style={{color: '#666', marginTop: '20px'}}>
                  No tienes compras registradas aún
                </h3>
                <p style={{color: '#999'}}>
                  Agrega tu primera compra usando el formulario de arriba
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddiDebtTracker;