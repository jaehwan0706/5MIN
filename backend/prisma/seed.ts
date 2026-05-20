import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 골든타임 카테고리 4종 + 단계별 지침 시드
  const categories = [
    {
      title: "심폐소생술 (CPR)",
      iconName: "cpr",
      colorHex: "#FF3B30",
      animationFile: "cpr.json",
      displayOrder: 1,
      steps: [
        {
          stepNumber: 1,
          summaryText: "어깨를 두드리며 반응 확인\n119에 즉시 신고\nAED 요청",
          detailText:
            "환자의 양쪽 어깨를 두드리며 '괜찮으세요?'라고 크게 외치세요. 반응이 없으면 즉시 119에 신고하고 주변에 AED를 가져달라고 요청하세요.",
        },
        {
          stepNumber: 2,
          summaryText:
            "가슴 중앙에 두 손 깍지\n5~6cm 깊이로 압박\n분당 100~120회",
          detailText:
            "환자를 단단한 바닥에 눕히고 가슴 중앙(흉골 하단 1/2)에 두 손 깍지를 끼세요. 팔꿈치를 펴고 체중을 실어 5~6cm 깊이로 강하게 압박하세요.",
        },
        {
          stepNumber: 3,
          summaryText: "30회 압박 후 인공호흡 2회\nAED 도착 시 즉시 부착\n구급대 도착까지 반복",
          detailText:
            "가슴압박 30회 후 머리를 뒤로 젖혀 기도를 열고 인공호흡 2회를 실시하세요. AED가 도착하면 즉시 전원을 켜고 지시에 따르세요.",
        },
      ],
    },
    {
      title: "기도폐쇄 / 하임리히",
      iconName: "heimlich",
      colorHex: "#FF9500",
      animationFile: "heimlich.json",
      displayOrder: 2,
      steps: [
        {
          stepNumber: 1,
          summaryText: "기침 유도 (말할 수 있는 경우)\n말·호흡 불가 시 즉시 119\n등 두드리기 5회",
          detailText:
            "환자가 기침을 할 수 있으면 강하게 기침하도록 유도하세요. 말을 못하거나 호흡이 안 되면 즉시 119에 신고하고 한 손으로 가슴을 받치며 등을 5회 강하게 두드리세요.",
        },
        {
          stepNumber: 2,
          summaryText: "명치와 배꼽 사이에 주먹\n위 안쪽 방향으로 5회 압박\n이물질 나올 때까지 반복",
          detailText:
            "환자 뒤에서 한 손으로 주먹을 쥐고 명치와 배꼽 사이에 위치시킨 후 다른 손으로 감싸세요. 위쪽 안쪽 방향으로 강하게 5회 압박하세요.",
        },
        {
          stepNumber: 3,
          summaryText: "영아는 얼굴 아래 향한 채\n등 두드리기 5회\n가슴 압박 5회 교대",
          detailText:
            "1세 미만 영아는 한 팔에 얼굴이 아래를 향하도록 엎드려 올리고 손바닥으로 등 중앙을 5회 두드린 후, 뒤집어 두 손가락으로 가슴 압박 5회를 교대로 실시하세요.",
        },
      ],
    },
    {
      title: "영유아 고열경련",
      iconName: "fever",
      colorHex: "#34C759",
      animationFile: "fever.json",
      displayOrder: 3,
      steps: [
        {
          stepNumber: 1,
          summaryText: "평평한 곳에 옆으로 눕히기\n주변 위험물 치우기\n입에 아무것도 넣지 않기",
          detailText:
            "아이를 단단하고 평평한 바닥에 옆으로 눕히세요. 주변 날카롭거나 딱딱한 물건을 치우고, 혀를 깨물지 않도록 입에 손가락이나 물건을 절대 넣지 마세요.",
        },
        {
          stepNumber: 2,
          summaryText: "경련 시간 타이머 측정\n5분 이상 지속 시 즉시 119\n호흡 상태 지속 관찰",
          detailText:
            "경련 시작 시간을 반드시 기록하세요. 경련이 5분 이상 지속되거나, 경련 후 의식이 돌아오지 않으면 즉시 119에 신고하세요.",
        },
        {
          stepNumber: 3,
          summaryText: "경련 후 옆으로 누운 자세 유지\n39도 이상 시 해열제 투여\n소아청소년과 방문 필수",
          detailText:
            "경련이 멈춘 후 아이를 옆으로 눕혀 기도를 확보하세요. 체온이 39°C 이상이면 해열제를 투여하고, 경련 여부와 관계없이 소아청소년과 진료를 받으세요.",
        },
      ],
    },
    {
      title: "중증화상",
      iconName: "burn",
      colorHex: "#007AFF",
      animationFile: "burn.json",
      displayOrder: 4,
      steps: [
        {
          stepNumber: 1,
          summaryText: "화염·전기 위험원 즉시 제거\n옷·장신구 빠르게 제거\n119 신고",
          detailText:
            "환자를 화염·열원에서 즉시 분리하세요. 화상 부위의 옷과 반지, 시계 등 장신구를 빠르게 제거하고 즉시 119에 신고하세요.",
        },
        {
          stepNumber: 2,
          summaryText: "흐르는 찬물로 15~20분 냉각\n얼음·된장·치약 절대 금지\n체온 저하 주의",
          detailText:
            "화상 부위를 흐르는 시원한 물(15~20°C)로 15~20분 냉각하세요. 얼음, 된장, 치약, 소주 등 민간요법은 절대 사용하지 마세요.",
        },
        {
          stepNumber: 3,
          summaryText: "멸균 거즈나 깨끗한 천으로 덮기\n물집 터트리지 않기\n응급실 이송",
          detailText:
            "냉각 후 멸균 거즈나 깨끗한 천으로 화상 부위를 덮으세요. 물집은 절대 터트리지 마세요. 손바닥 크기 이상이거나 얼굴·손·발·관절 부위는 반드시 응급실로 이송하세요.",
        },
      ],
    },
  ];

  for (const cat of categories) {
    const { steps, ...catData } = cat;
    const created = await prisma.goldenTimeCategory.upsert({
      where: { title: catData.title },
      update: {},
      create: catData,
    });

    for (const step of steps) {
      await prisma.goldenTimeStep.upsert({
        where: {
          categoryId_stepNumber: {
            categoryId: created.id,
            stepNumber: step.stepNumber,
          },
        },
        update: { summaryText: step.summaryText, detailText: step.detailText },
        create: {
          categoryId: created.id,
          stepNumber: step.stepNumber,
          summaryText: step.summaryText,
          detailText: step.detailText,
          displayOrder: step.stepNumber,
        },
      });
    }
  }

  console.log("Seed complete: GoldenTime categories & steps");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
