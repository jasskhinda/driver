'use client';

import Link from 'next/link';
import DashboardLayout from './DashboardLayout';

export default function InvoiceDetail({ invoice, user }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
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

  // Check if invoice is overdue
  const isOverdue = invoice.status === 'pending' && new Date(invoice.due_date) < new Date();

  return (
    <DashboardLayout user={user} activeTab="invoices">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-primary dark:text-white">
              Invoice #{invoice.invoice_number}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Created on {formatDate(invoice.created_at)}
            </p>
          </div>
          <Link
            href="/dashboard/invoices"
            className="text-secondary hover:text-secondary/80 dark:text-dark-primary dark:hover:text-dark-primary/80"
          >
            ← Back to Invoices
          </Link>
        </div>

        {/* Invoice Card */}
        <div className="bg-white dark:bg-dark-surface rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8">
          {/* Status Badge */}
          <div className="mb-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(invoice.status)}`}>
              {getStatusText(invoice.status)}
            </span>
            {isOverdue && (
              <span className="ml-2 text-sm text-red-600 dark:text-red-400">
                (Overdue since {formatDate(invoice.due_date)})
              </span>
            )}
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Invoice Number
              </h3>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {invoice.invoice_number}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Due Date
              </h3>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {formatDate(invoice.due_date)}
              </p>
            </div>

            {invoice.paid_date && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Paid Date
                </h3>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(invoice.paid_date)}
                </p>
              </div>
            )}

            {invoice.payment_method && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Payment Method
                </h3>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {invoice.payment_method}
                </p>
              </div>
            )}
          </div>

          {/* Trip Information */}
          {invoice.trip && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Trip Details
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pickup</p>
                  <p className="text-gray-900 dark:text-gray-100">{invoice.trip.pickup_address}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDateTime(invoice.trip.pickup_time)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Destination</p>
                  <p className="text-gray-900 dark:text-gray-100">{invoice.trip.destination_address}</p>
                </div>
                {invoice.trip.distance && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Distance</p>
                    <p className="text-gray-900 dark:text-gray-100">{invoice.trip.distance} miles</p>
                  </div>
                )}
                {invoice.trip.special_requirements && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Special Requirements</p>
                    <p className="text-gray-900 dark:text-gray-100">{invoice.trip.special_requirements}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Amount Breakdown */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Amount Breakdown
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-900 dark:text-gray-100">${invoice.amount.toFixed(2)}</span>
              </div>
              {invoice.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tax</span>
                  <span className="text-gray-900 dark:text-gray-100">${invoice.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-lg font-medium text-gray-900 dark:text-gray-100">Total</span>
                <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  ${invoice.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {invoice.description && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Description
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{invoice.description}</p>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Notes
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{invoice.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Print Invoice
            </button>
            {invoice.status === 'pending' && (
              <Link
                href={`/dashboard/invoices/${invoice.id}/pay`}
                className="px-4 py-2 bg-secondary text-on-secondary dark:bg-dark-primary dark:text-dark-on-primary rounded-md hover:bg-secondary/90 dark:hover:bg-dark-primary/90"
              >
                Pay Invoice
              </Link>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}