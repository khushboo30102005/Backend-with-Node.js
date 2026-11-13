import { planHasFeature } from '../config/plans.js';
import { getSubscriptionSummary } from '../services/subscriptionService.js';

// Route guard for future Premium-only features, enforced on the server:
//   router.post('/something', requireFeature('someFeature'), handler)
// Add the feature key to PLAN_FEATURES.premium in config/plans.js first.
export const requireFeature = (feature) => async (req, res, next) => {
  try {
    const { plan } = await getSubscriptionSummary(req.user._id);
    if (planHasFeature(plan, feature)) return next();
    return res.status(403).json({
      error: 'This feature is available on the Premium plan.',
      code: 'PREMIUM_REQUIRED',
    });
  } catch (err) {
    next(err);
  }
};
