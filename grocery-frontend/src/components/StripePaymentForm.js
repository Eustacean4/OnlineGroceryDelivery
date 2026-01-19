import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const StripePaymentForm = ({ clientSecret, onPaymentSuccess, onPaymentError, loading }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    const cardElement = elements.getElement(CardElement);

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          // Add user details here if needed
        },
      }
    });

    if (error) {
      onPaymentError(error.message);
    } else if (paymentIntent.status === 'succeeded') {
      onPaymentSuccess(paymentIntent);
    }
    
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      <button
        type="submit"
        disabled={!stripe || processing || loading}
        style={{
          marginTop: '1rem',
          width: '100%',
          padding: '0.75rem',
          backgroundColor: '#4a8f29',
          color: 'white',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

export default StripePaymentForm;