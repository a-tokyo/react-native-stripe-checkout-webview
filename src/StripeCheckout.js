/* @flow */
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import stripeCheckoutRedirectHTML from './stripeCheckoutRedirectHTML';

type Props = {
  /** Stripe public key */
  stripePublicKey: string,
  /** Stripe Checkout Session input */
  checkoutSessionInput: {
    sessionId: string,
    successUrl: string,
    cancelUrl: string,
    // common
    customerEmail?: string,
    billingAddressCollection?: 'required' | 'auto',
    shippingAddressCollection?: {
      allowedCountries: Array<string>,
    },
    locale?: string,
  }
| {
    clientReferenceId: string,
    successUrl: string,
    cancelUrl: string,
    items?: Array<{ plan: string, quantity: string }>,
    lineItems?: Array<{ price: number, quantity: number }>,
    mode?: 'payment' | 'subscription',
    submitType?: string,
    // common
    customerEmail?: string,
    billingAddressCollection?: 'required' | 'auto',
    shippingAddressCollection?: {
      allowedCountries: Array<string>,
    },
    locale?: string,
  },
  /** Called when the Stripe checkout session completes with status 'success' */
  onSuccess: ({ [key: string]: any, checkoutSessionId?: string }) => any,
  /** Called when the Stripe checkout session completes with status 'cancel' */
  onCancel: ({ [key: string]: any }) => any,
  /** Called when the Stripe checkout session webpage loads successfully */
  onLoadingComplete?: (syntheticEvent: SyntheticEvent) => any,
  /** Extra options */
  options?: {
    /** The loading item is set on the element with id='sc-loading' */
    htmlContentLoading?: string,
    /** The error is set on the element with id='sc-error-message' */
    htmlContentError?: string,
  },
  /** Props passed to the WebView */
  webViewProps?: Object,
  /** Renders the component shown when checkout session is completed */
  renderOnComplete?: () => React$Node,
};

/**
 * StripeCheckoutWebView
 *
 * Handles a full Stripe Checkout journey on react native via webview
 *
 * Important Notes about URLs:
 * - successUrl must have the query string params `?sc_checkout=success&sc_sid={CHECKOUT_SESSION_ID}`
 *   - sc_sid is optional - must be the last param - when passed results in sessionId being passed to the onSuccess function
 * - cancelUrl must have the query string params `?sc_checkout=cancel`
 */
const StripeCheckoutWebView = (props: Props) => {
  const {
    stripePublicKey,
    checkoutSessionInput,
    onSuccess,
    onCancel,
    onLoadingComplete,
    options,
    webViewProps = {},
    renderOnComplete,
  } = props;
  /** Holds the complete URL if exists */
  const [completed, setCompleted] = useState(null);
  /** Holds wether Stripe Checkout has loaded yet */
  const [hasLoaded, setHasLoaded] = useState(false);

  /**
   * Called everytime the URL stats to load in the webview
   *
   * handles completing the checkout session
   */
  const _onLoadStart = (syntheticEvent: SyntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    const { url: currentUrl } = nativeEvent;
    /** Check and handle checkout state: success */
    if (currentUrl.includes('sc_checkout=success')) {
      const checkoutSessionIdKey = 'sc_sid=';
      const checkoutSessionId = currentUrl
        .substring(currentUrl.indexOf(checkoutSessionIdKey), currentUrl.length)
        /** remove key */
        .replace(checkoutSessionIdKey, '')
        /** remove extra trailing slash */
        .replace('/', '');
      setCompleted(true);
      if (onSuccess) {
        onSuccess({ ...props, checkoutSessionId });
      }
      return;
    }
    /** Check and handle checkout state: cancel */
    if (currentUrl.includes('sc_checkout=cancel')) {
      setCompleted(true);
      if (onCancel) {
        onCancel(props);
      }
    }
    /** call webViewProps.onLoadStart */
    if (webViewProps && webViewProps.onLoadStart) {
      webViewProps.onLoadStart(syntheticEvent);
    }
  };

  /**
   * Called upon URL load complete
   */
  const _onLoadEnd = (syntheticEvent: SyntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    /** set isLoading to false once the stripe checkout page loads */
    if (!hasLoaded && nativeEvent.url.startsWith('https://checkout.stripe.com') && onLoadingComplete) {
      setHasLoaded(true);
      onLoadingComplete(syntheticEvent);
    }
    /** call webViewProps.onLoadStart */
    if (webViewProps && webViewProps.onLoadEnd) {
      webViewProps.onLoadEnd(syntheticEvent);
    }
  };

  /** If the checkout session is complete -- render the complete content */
  if (completed) {
    return renderOnComplete ? (
      renderOnComplete({ url: completed, ...props })
    ) : (
      <Text>Stripe Checkout session complete.</Text>
    );
  }

  /** Render the WebView holding the Stripe checkout flow */
  return (
    <>
    <StatusBar style="dark"/>
    <WebView
      /** pass baseUrl to avoid  `IntegrationError: Live Stripe.js integrations must use HTTPS.` error https://github.com/react-native-community/react-native-webview/issues/1317 */
      baseUrl=""
      originWhitelist={['*']}
      {...webViewProps}
      source={{
        html: stripeCheckoutRedirectHTML(
          stripePublicKey,
          checkoutSessionInput,
          options,
        ),
        // Ensure an https baseUrl is used to avoid infinite loading on production due to https://github.com/A-Tokyo/react-native-stripe-checkout-webview/issues/10
        baseUrl: 'https://stripe.com',
        ...webViewProps?.source,
      }}
      onLoadStart={_onLoadStart}
      onLoadEnd={_onLoadEnd}
      style={{marginTop: 40}}
    />
    </>
  );
};

export default StripeCheckoutWebView;
