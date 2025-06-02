// import { JwtPayload } from 'jsonwebtoken';
// import { IOrder } from './order.interface';
// import { Order } from './order.model';
// import { Delivery } from '../delivery/delivery.model';
// import stripe from '../../../config/stripe';
// // import { getDistanceAndDurationFromGoogle } from './distanceCalculation';

// const CHARGE_PER_KM = 2;

// function getDistanceFromLatLonInKm(
//   coord1: [number, number],
//   coord2: [number, number]
// ): number {
//   const toRad = (value: number) => (value * Math.PI) / 180;

//   const [lon1, lat1] = coord1;
//   const [lon2, lat2] = coord2;

//   const R = 6371; // Radius of earth in km
//   const dLat = toRad(lat2 - lat1);
//   const dLon = toRad(lon2 - lon1);
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(toRad(lat1)) *
//       Math.cos(toRad(lat2)) *
//       Math.sin(dLon / 2) *
//       Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// export const createParcelOrderToDB = async (
//   user: JwtPayload,
//   payload: IOrder
// ) => {
//   // calculate distance  using pickupLocation and destinationLocation coordinates
//   const distance = getDistanceFromLatLonInKm(
//     payload.pickupLocation.coordinates,
//     payload.destinationLocation.coordinates
//   );

//   // calculate delivery charge based on distance
//   const deliveryCharge = distance * CHARGE_PER_KM;

//   // create order with calculated distance and deliveryCharge
//   const order = await Order.create({
//     ...payload,
//     user: user.id,
//     distance,
//     deliveryCharge,
//   });

//   const delivery = await Delivery.create({
//     order: order._id,
//     status: 'REQUESTED',
//   });

//   // 5. Create Stripe checkout session
//   const session = await stripe.checkout.sessions.create({
//     payment_method_types: ['card'],
//     mode: 'payment',
//     line_items: [
//       {
//         price_data: {
//           currency: 'usd',
//           product_data: {
//             name: `Parcel Delivery to ${payload.destinationLocation.address}`,
//             description: `Type: ${payload.parcelType}, Weight: ${payload.parcelWeight}kg`,
//             metadata: {
//               pickupAddress: payload.pickupLocation.address,
//               destinationAddress: payload.destinationLocation.address,
//               parcelType: payload.parcelType,
//               ride: payload.ride,
//             },
//           },
//           unit_amount: Math.round(deliveryCharge * 100), // in cents
//         },
//         quantity: 1,
//       },
//     ],
//     success_url: `https://yourdomain.com/payment-success?orderId=${order._id}`,
//     cancel_url: `https://yourdomain.com/payment-cancel?orderId=${order._id}`,
//     payment_intent_data: {
//       metadata: {
//         orderId: order._id.toString(),
//         userId: user.id,
//         deliveryId: delivery.id,
//         receiversName: payload.receiversName,
//         contact: payload.contact,
//         parcelType: payload.parcelType,
//         parcelWeight: payload.parcelWeight.toString(),
//         parcelValue: payload.parcelValue.toString(),
//         ride: payload.ride,
//       },
//     },
//     customer_email: user.email,
//   });

//   console.log(session);

//   return { order, delivery, redirectUrl: session.url };

//   // return { order, delivery };
// };

// // export const createParcelOrderToDB = async (user: JwtPayload, payload: IOrder) => {
// //     const origin = payload.pickupLocation.coordinates;       // [lng, lat]
// //     const destination = payload.destinationLocation.coordinates; // [lng, lat]

// //     // call Google Maps Distance Matrix API
// //     const { distance, duration } = await getDistanceAndDurationFromGoogle(origin, destination);

// //     // convert distance to km (Google returns meters)
// //     const distanceInKm = distance / 1000;

// //     // delivery charge calculation
// //     const deliveryCharge = distanceInKm * CHARGE_PER_KM;

// //     const order = await Order.create({
// //         ...payload,
// //         user: user.id,
// //         distance: distanceInKm,
// //         estimatedTime: duration,      // in seconds, save ETA if needed
// //         deliveryCharge,
// //     });

// //     const delivery = await Delivery.create({
// //         order: order._id,
// //         status: "REQUESTED",
// //     });

// //     return { order, delivery };
// // // };

// export const OrderServices = {
//   createParcelOrderToDB,
// };
