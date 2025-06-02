import QueryBuilder from '../../builder/QueryBuilder';
import { TContactUs } from './contact.interface';
import { ContactUs } from './contact.model';

const createContactUsService = async (payload: TContactUs, userId: any) => {
  const result = await ContactUs.create(payload);

  // let message = 'User want to contact';
  // await notificationService.createNotification({
  //   message,
  //   userId,
  // });

  // io.emit('notiffication::admin', { success: true, message });

  return result;
};

const getAllContactUsService = async (query: Record<string, unknown>) => {
  const allContactUs = new QueryBuilder(ContactUs.find({}), query)
    .sort()
    .paginate();

  const result = await allContactUs.modelQuery;
  const meta = await allContactUs.countTotal();

  return { meta, result };
};

export const contactUsService = {
  createContactUsService,
  getAllContactUsService,
};
