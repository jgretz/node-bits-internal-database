// compile
const compileConfiguration = (options = {}, bitsConfig) =>
  ({
    forceSync: false,

    ...options,
    ...bitsConfig,
  });

export const initialize = implementation => options =>
  ({
    initializeDatabase: bitsConfig => {
      const config = compileConfiguration(options, bitsConfig);
      const database = implementation(config);

      database.connect();

      return database;
    },
  });
