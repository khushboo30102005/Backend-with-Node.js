import {
  createPremiumOrder,
  verifyPayment,
  reportPaymentFailure,
} from '../apis/paymentApi';

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
let scriptPromise = null;

export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = () =>
        window.Razorpay
          ? resolve(window.Razorpay)
          : reject(new Error('Razorpay Checkout failed to initialise.'));
      s.onerror = () => {
        scriptPromise = null;
        s.remove();
        reject(
          new Error(
            'Could not load the payment window. Check your connection or disable any blocker and try again.',
          ),
        );
      };
      document.body.appendChild(s);
    });
  }
  return scriptPromise;
}

export function formatPrice(paise, currency = 'INR') {
  if (paise == null) return '—';
  const amount = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

// Opens Razorpay Checkout for the Premium plan. Resolves (never rejects) once
// the attempt ends with one of:
//   { status: 'paid',      data }     verified and activated by the server
//   { status: 'cancelled' }           the user closed the window
//   { status: 'failed',    message }  payment failed or could not be verified
//   { status: 'pending',   message }  paid, but the server could not confirm yet;
//                                     the webhook will activate it shortly
// It throws only if the order could not be created or Checkout could not load.
export async function startPremiumCheckout() {
  const [Razorpay, order] = await Promise.all([loadRazorpay(), createPremiumOrder()]);

  return new Promise((resolve) => {
    let settled = false;
    let handlerStarted = false;
    let lastFailure = '';
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const rzp = new Razorpay({
      key: order.keyId, // public key id only; the secret never reaches the browser
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: order.name,
      description: order.description,
      prefill: order.prefill,
      theme: { color: '#4f6df5' },
      handler: async (response) => {
        handlerStarted = true;
        try {
          const data = await verifyPayment(response);
          finish({ status: 'paid', data });
        } catch (err) {
          const code = err.response?.status;
          const message =
            err.response?.data?.error || 'We could not confirm your payment yet.';
          finish({
            status: [400, 402, 404, 409].includes(code) ? 'failed' : 'pending',
            message,
          });
        }
      },
      modal: {
        ondismiss: () => {
          if (settled || handlerStarted) return;
          if (lastFailure) {
            finish({ status: 'failed', message: lastFailure });
          } else {
            reportPaymentFailure(order.orderId, 'cancelled').catch(() => {});
            finish({ status: 'cancelled' });
          }
        },
      },
    });

    rzp.on('payment.failed', (response) => {
      lastFailure =
        response?.error?.description || 'The payment failed. You have not been charged.';
      reportPaymentFailure(order.orderId, 'failed', lastFailure).catch(() => {});
    });

    rzp.open();
  });
}
