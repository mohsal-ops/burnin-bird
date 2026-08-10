import { PrismaClient } from "../generated/prisma/index.js";

const db = new PrismaClient();

async function main() {
  await db.partner.deleteMany();

  await db.partner.createMany({
    data: [
      {
        name: "Jabril Riddick",
        role: "Partner & CCO",
        image: "/general/generalPages/jabril.jpg",
        accent: "#c85a1e",
        order: 0,
        bio: [
          "Jabril Riddick is a seasoned culinary professional with over 15 years of hands-on experience in the food industry. His journey from line cook to Executive Chef is a testament to his dedication, passion, and unmatched work ethic giving him a rare, ground-level understanding of every aspect of restaurant operations.",
          "Jabril's expertise spans every position in the industry, providing him with an invaluable perspective on how a kitchen should run efficiently and with the highest standards. Throughout his career he has played a key role in opening several restaurants crafting menus, organizing front and back of house operations, and building the right teams from the ground up.",
          "As Partner and Chief Culinary Officer, Jabril brings the kind of culinary artistry and operational leadership that not only elevates the dining experience, but ensures the business is built to thrive.",
        ],
      },
      {
        name: "Jordan Riddick",
        role: "Partner & CEO",
        image: "/general/generalPages/jordan.jpg",
        accent: "#1a6b3c",
        order: 1,
        bio: [
          "Jordan Riddick is a seasoned financial and accounting professional with over 15 years of experience helping businesses strengthen their financial foundation and drive sustainable growth. With deep expertise in Gross Profit, EBITDA, financial statement preparation, budgeting, and forecasting, Jordan brings a comprehensive and strategic approach to every organization he works with.",
          "Throughout his career Jordan has proven himself as more than just a numbers expert he is a results-driven leader who understands the bigger picture. He has successfully guided companies through rebuilding accounting departments, led new software implementations, and introduced strategic cost-cutting measures that simultaneously fuel expansion and long-term growth.",
          "As Owner and CEO, Jordan combines extensive technical knowledge with a forward-thinking mindset, making him a trusted partner for businesses looking to optimize their operations and position themselves for lasting success.",
        ],
      },
    ],
  });

  console.log("Partners seeded");
}

main().then(() => db.$disconnect());