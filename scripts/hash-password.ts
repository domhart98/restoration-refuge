const bcrypt = require("bcryptjs");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter the owner's password: ", async (password) => {
  try {
    if (password.length < 12) {
      console.error("Use a password with at least 12 characters.");
      process.exitCode = 1;
      return;
    }

    const hash = await bcrypt.hash(password, 12);
    console.log("\nPassword hash:\n" + hash);
  } catch (error) {
    console.error("Could not generate password hash.");
    process.exitCode = 1;
  } finally {
    rl.close();
  }
});