import express from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { UserRoutes } from '../app/modules/user/user.route';
import { ServiceRoutes } from '../app/modules/service/service.route';
import { RuleRoutes } from '../app/modules/rule/rule.route';
import { ChatRoutes } from '../app/modules/chat/chat.routes';
import { MessageRoutes } from '../app/modules/message/message.routes';
import { NotificationRoutes } from '../app/modules/notification/notification.routes';
import { BannerRoutes } from '../app/modules/banner/banner.routes';
import { RideRoutes } from '../app/modules/ride/ride.route';
import { BookingRoutes } from '../app/modules/booking/booking.route';
import { PaymentRoutes } from '../app/modules/payment/payment.route';
import ContactUsRoutes from '../app/modules/contact/contact.route';
import { CategoryRoutes } from '../app/modules/category/category.route';
import { PackageRoutes } from '../app/modules/package/package.route';
import { CabwireRoutes } from '../app/modules/cabwire/cabwire.route';
const router = express.Router();

const apiRoutes = [
  {
    path: '/user',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },

  // service
  {
    path: '/category',
    route: CategoryRoutes,
  },
  {
    path: '/service',
    route: ServiceRoutes,
  },
  {
    path: '/package',
    route: PackageRoutes,
  },
  {
    path: '/cabwire',
    route: CabwireRoutes,
  },
  {
    path: '/cabwire-booking',
    route: BookingRoutes,
  },
  {
    path: '/banner',
    route: BannerRoutes,
  },
  {
    path: '/contact',
    route: ContactUsRoutes,
  },
  {
    path: '/rule',
    route: RuleRoutes,
  },
  {
    path: '/ride',
    route: RideRoutes,
  },
  {
    path: '/booking',
    route: BookingRoutes,
  },
  {
    path: '/payment',
    route: PaymentRoutes,
  },
  {
    path: '/room',
    route: ChatRoutes,
  },
  {
    path: '/chat',
    route: ChatRoutes,
  },
  {
    path: '/message',
    route: MessageRoutes,
  },
  {
    path: '/notification',
    route: NotificationRoutes,
  },
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
