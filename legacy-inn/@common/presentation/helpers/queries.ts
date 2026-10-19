export const setComillasForQueryWithArrayString = (data: any[]) => {
  const response: any[] = [];

  data.forEach(el => {
    response.push(`'${el}'`);
  });

  return response;
};
