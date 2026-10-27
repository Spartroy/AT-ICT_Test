jest.mock('../services/notifications', () => ({ notify: jest.fn(async () => 1), teacherIds: jest.fn(async () => ['t1']) }));

const Payment = require('../models/Payment');
const User = require('../models/User');
const Parent = require('../models/Parent');
const { reviewPayment, submitInstapayWithProof, payPayment } = require('../controllers/paymentController');
const { notify } = require('../services/notifications');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};
const fakePayment = (over = {}) => ({
  _id: 'p1', student: 'stu1', amount: 500, currency: 'EGP', status: 'pending', dueDate: null,
  save: jest.fn(async function save() { return this; }), ...over,
});

afterEach(() => jest.restoreAllMocks());

describe('parent submits proof', () => {
  const setup = (payment) => {
    jest.spyOn(Parent, 'findOne').mockReturnValue({ populate: async () => null });
    jest.spyOn(User, 'findById').mockImplementation((id) => ({
      select: () => ({ lean: async () => ({ parentInfo: { children: [{ studentId: 'stu1', isPrimary: true }] } }), then: undefined, firstName: 'Omar', lastName: 'Ali' }),
    }));
    jest.spyOn(Payment, 'findById').mockResolvedValue(payment);
  };
  const req = () => ({ user: { id: 'par1' }, params: { paymentId: 'p1' }, file: { mimetype: 'image/png', filename: 'x.png', originalname: 'x.png', path: '/tmp/none' } });

  it('puts the payment in review and does not mark it paid', async () => {
    const payment = fakePayment();
    setup(payment);
    const res = mockRes();
    await submitInstapayWithProof(req(), res);
    expect(payment.status).toBe('review');
    expect(payment.paidDate).toBeUndefined();
    expect(payment.paymentProof.path).toBe('/uploads/payments/x.png');
    expect(notify).toHaveBeenCalled();
  });

  it('refuses a second proof while one is waiting, and for paid payments', async () => {
    for (const status of ['review', 'paid']) {
      const payment = fakePayment({ status });
      setup(payment);
      const res = mockRes();
      await submitInstapayWithProof(req(), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(payment.save).not.toHaveBeenCalled();
    }
  });

  it('card payments never mark anything paid', async () => {
    const res = mockRes();
    await payPayment({ body: { paymentMethod: 'card' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('teacher reviews proof', () => {
  const run = async (payment, body) => {
    jest.spyOn(Payment, 'findById').mockResolvedValue(payment);
    const res = mockRes();
    await reviewPayment({ user: { id: 'teach1' }, params: { paymentId: 'p1' }, body }, res);
    return res;
  };

  it('confirm marks it paid by the teacher', async () => {
    const payment = fakePayment({ status: 'review', paymentProof: { path: '/uploads/payments/x.png' } });
    await run(payment, { decision: 'confirm' });
    expect(payment.status).toBe('paid');
    expect(payment.paidDate).toBeInstanceOf(Date);
    expect(payment.confirmedBy).toBe('teach1');
  });

  it('reject needs a reason, clears the proof and keeps the reason for the parent', async () => {
    let payment = fakePayment({ status: 'review', paymentProof: { path: '/uploads/payments/x.png' } });
    let res = await run(payment, { decision: 'reject' });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(payment.status).toBe('review');

    res = await run(payment, { decision: 'reject', reason: 'Amount does not match' });
    expect(payment.status).toBe('pending');
    expect(payment.paymentProof).toBeUndefined();
    expect(payment.lastRejection).toMatchObject({ reason: 'Amount does not match', proofPath: '/uploads/payments/x.png' });
  });

  it('a rejected proof on a late payment goes back to overdue', async () => {
    const payment = fakePayment({ status: 'review', dueDate: new Date('2020-01-01') });
    await run(payment, { decision: 'reject', reason: 'Blurry' });
    expect(payment.status).toBe('overdue');
  });

  it('only works while a proof is waiting', async () => {
    const payment = fakePayment({ status: 'pending' });
    const res = await run(payment, { decision: 'confirm' });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(payment.save).not.toHaveBeenCalled();
  });
});
