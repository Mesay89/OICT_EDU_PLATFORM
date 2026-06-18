/**
 * Run an Express controller handler in-process (same logic as HTTP routes).
 */
export const invokeController = (handler, body = {}, params = {}) =>
  new Promise((resolve, reject) => {
    const req = { body, params };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        resolve({ status: this.statusCode, data });
      },
    };

    Promise.resolve(handler(req, res)).catch(reject);
  });
