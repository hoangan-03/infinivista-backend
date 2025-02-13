// import { DataSource } from "typeorm";
// import { faker } from "@faker-js/faker";
// import { User } from "@/entities/user.entity";
// import { Setting } from "@/entities/setting.entity";
// import { Address } from "@/entities/address.entity";
// import { SecurityAnswer } from "@/entities/security-answer.entity";
// import { Gender } from "@/modules/user/enums/gender.enum";
// import { SettingType } from "@/enum/setting.enum";
// import { Country } from "@/entities/country.entity";
// import { City } from "@/entities/city.entity";
// import { PaymentMethodType } from "@/enum/payment-method.enum";
// import { SecurityQuestion } from "@/entities/security-question.entity";
// import { PaymentMethods } from "@/entities/payment-methods.entity";

// const securityQuestions = [
//   "What was your first pet's name?",
//   "What is your mother's maiden name?",
//   "In which city were you born?",
//   "What was the name of your first school?",
//   "What is your favorite movie?",
// ];

// const createFakePaymentMethod = (userId: string) => {
//   const type = faker.helpers.arrayElement(Object.values(PaymentMethodType));

//   return {
//     user_id: userId,
//     payment_method: type,
//     card_last_four:
//       type === PaymentMethodType.PAYPAL
//         ? faker.finance.creditCardNumber("####")
//         : null,
//     payment_token: `tok_${faker.string.alphanumeric(10)}`,
//     card_expiration_date:
//       type === PaymentMethodType.PAYPAL
//         ? `${faker.date.future().getMonth() + 1}/${faker.date
//             .future()
//             .getFullYear()
//             .toString()
//             .slice(-2)}`
//         : null,
//   };
// };

// const createSecurityAnswers = (
//   userId: string,
//   questions: SecurityQuestion[]
// ) => {
//   return questions.slice(0, 3).map((question) => ({
//     user_id: userId,
//     question_id: question.id,
//     answer: faker.lorem.word(),
//   }));
// };

// const createFakeUser = () => {
//   const gender = faker.helpers.arrayElement([
//     Gender.MALE,
//     Gender.FEMALE,
//     Gender.OTHER,
//   ]) as Gender;
//   const genderParam =
//     gender === Gender.OTHER
//       ? undefined
//       : (gender.toLowerCase() as "male" | "female");
//   const firstName = faker.person.firstName(genderParam);
//   const lastName = faker.person.lastName();

//   return {
//     email: faker.internet.email({ firstName, lastName }),
//     username: faker.internet.username({ firstName, lastName }),
//     password: faker.internet.password(),
//     phoneNumber: faker.phone.number({ style: "national" }),
//     dob: faker.date.birthdate(),
//     gender,
//     firstName,
//     lastName,
//     profileImageUrl: faker.image.avatar(),
//     coverImageUrl: faker.image.url(),
//     isOnline: faker.datatype.boolean(),
//     isSuspended: false,
//     address: {
//       city: faker.location.city(),
//       country: faker.location.country(),
//       postal_code: faker.location.zipCode(),
//       shipping_address: faker.location.streetAddress(),
//     },
//     settings: [
//       {
//         type: SettingType.NOTIFICATION,
//         value: faker.datatype.boolean().toString(),
//       },
//       {
//         type: SettingType.POST_PRIVACY,
//         value: faker.helpers.arrayElement(["public", "private", "friends"]),
//       },
//       {
//         type: SettingType.ACCOUNT_PRIVACY,
//         value: faker.helpers.arrayElement(["public", "private", "friends"]),
//       },
//       { type: SettingType.LANGUAGE, value: faker.location.countryCode() },
//       {
//         type: SettingType.THEME,
//         value: faker.helpers.arrayElement(["light", "dark"]),
//       },
//     ],
//   };
// };

// export const seedUsers = async (dataSource: DataSource, count = 10) => {
//   const userRepository = dataSource.getRepository(User);
//   const settingRepository = dataSource.getRepository(Setting);
//   const addressRepository = dataSource.getRepository(Address);
//   const cityRepository = dataSource.getRepository(City);
//   const countryRepository = dataSource.getRepository(Country);
//   const securityQuestionRepository = dataSource.getRepository(SecurityQuestion);
//   const securityAnswerRepository = dataSource.getRepository(SecurityAnswer);
//   const paymentMethodRepository = dataSource.getRepository(PaymentMethods);
//   await settingRepository.clear();
//   await securityAnswerRepository.clear();
//   await paymentMethodRepository.clear();
//   await addressRepository.clear();
//   await userRepository.clear();
//   await cityRepository.clear();
//   await countryRepository.clear();
//   await securityQuestionRepository.clear();

//   console.log("🔐 Seeding security questions...");
//   const questions = await Promise.all(
//     securityQuestions.map(async (question) => {
//       const securityQuestion = securityQuestionRepository.create({ question });
//       await securityQuestionRepository.save(securityQuestion);
//       return securityQuestion;
//     })
//   );
//   console.log(`✅ Created ${questions.length} security questions`);

//   console.log(`🌱 Seeding ${count} users...`);

//   for (let i = 0; i < count; i++) {
//     const userData = createFakeUser();
//     const {
//       address: addressData,
//       settings: settingsData,
//       ...userInfo
//     } = userData;

//     let country = await countryRepository.findOne({
//       where: { name: addressData.country },
//     });

//     if (!country) {
//       country = countryRepository.create({ name: addressData.country });
//       await countryRepository.save(country);
//       console.log(`🌍 Created country: ${country.name}`);
//     }

//     let city = await cityRepository.findOne({
//       where: { name: addressData.city },
//     });

//     if (!city) {
//       city = cityRepository.create({ name: addressData.city });
//       await cityRepository.save(city);
//       console.log(`🏙️ Created city: ${city.name}`);
//     }

//     const user = userRepository.create(userInfo);
//     await userRepository.save(user);
//     console.log(`📝 Created user: ${user.email}`);

//     const address = addressRepository.create({
//       shipping_address: addressData.shipping_address,
//       postal_code: addressData.postal_code,
//       city_id: city.id,
//       country_id: country.id,
//       user_id: user.id,
//     });
//     await addressRepository.save(address);
//     console.log(`📍 Added address for: ${user.email}`);

//     // Add security answers
//     const securityAnswers = createSecurityAnswers(user.id, questions);
//     await securityAnswerRepository.save(securityAnswers);
//     console.log(`🔑 Added security answers for: ${user.email}`);

//     // Add payment methods (1-3 per user)
//     const paymentMethodsCount = faker.number.int({ min: 1, max: 3 });
//     for (let j = 0; j < paymentMethodsCount; j++) {
//       const paymentMethodData = createFakePaymentMethod(user.id);
//       const paymentMethod = paymentMethodRepository.create(paymentMethodData);
//       await paymentMethodRepository.save(paymentMethod);
//     }
//     console.log(
//       `💳 Added ${paymentMethodsCount} payment methods for: ${user.email}`
//     );

//     for (const setting of settingsData) {
//       const newSetting = settingRepository.create({
//         ...setting,
//         user_id: user.id,
//       });
//       await settingRepository.save(newSetting);
//     }
//     console.log(`⚙️ Added settings for: ${user.email}`);
//   }
// };
