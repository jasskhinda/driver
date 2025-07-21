'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import DashboardLayout from './DashboardLayout';

export default function InvoicesList({ user }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const supabase = createClientComponentClient();

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          trip:trips(
            pickup_address,
            destination_address,
            pickup_time
          )
        `)
        .or(`user_id.eq.${user.id},trip.driver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'refunded':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <DashboardLayout user={user} activeTab="invoices">
      <div className="bg-surface dark:bg-dark-surface rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-primary dark:text-white mb-6">Invoices</h2>

        {/* Filter tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-6">
            {['all', 'pending', 'paid', 'overdue'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`pb-3 px-1 capitalize ${
                  filter === filterOption
                    ? 'border-b-2 border-secondary text-secondary dark:border-dark-primary dark:text-dark-primary font-medium'
                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {filterOption}
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary dark:border-dark-primary"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <svg 
              className="mx-auto h-12 w-12 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              No invoices found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filter === 'all' 
                ? "You don't have any invoices yet." 
                : `No ${filter} invoices found.`}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Trip
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(invoice.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {invoice.trip ? (
                          <div>
                            <p className="font-medium truncate max-w-xs">
                              {invoice.trip.pickup_address}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">
                              {formatDate(invoice.trip.pickup_time)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        ${invoice.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(invoice.status)}`}>
                          {getStatusText(invoice.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="text-secondary hover:text-secondary/80 dark:text-dark-primary dark:hover:text-dark-primary/80"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}