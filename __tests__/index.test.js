import StripeCheckoutDefault, {
  StripeCheckout,
  stripeCheckoutRedirectHTML,
} from '../src';

describe('index', () => {
  it('exports all values', () => {
    expect(StripeCheckoutDefault).toEqual(expect.any(Function));
    expect(StripeCheckout).toEqual(expect.any(Function));
    expect(stripeCheckoutRedirectHTML).toEqual(expect.any(Function));
  });
});
