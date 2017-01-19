// compile
const compileConfiguration = (options = {}, bitsConfig) => {
  return {
    forceSync: false,

    ...options,
    ...bitsConfig,
  };
};

export const initialize = (implementation) => {
  return (options) =>
  ({
    initializeDatabase: (bitsConfig) =>  {
      const config = compileConfiguration(options, bitsConfig);
      const database = implementation(config);

      database.connect();

      return database;
    }
  });
};
