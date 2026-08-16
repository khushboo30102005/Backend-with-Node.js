import * as z from 'zod';

/* const Schema = z
  .string('Please Enter a valid string.').regex(/^\d{4}$/, "Enter a valid 4 digit number.")
 */

  const Schema = z.object({
    name: z.string().min(3, "Please enter at least 3 character.").max(100, "Please enter at max 100 character."),
    age: z.number().lt(120),
    email: z.email().optional()
  })

const rawData = {name: "khushboo", age: 22};
const result = Schema.safeParse(rawData);
if (result.success) {
  console.log(result.data);
} else {
  console.log(result.error.issues);
}
console.log('Completed');
