
export default async () => {
  console.log('log from lambda');

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      hello: 'world',
    }),
  };

  return response;
};
