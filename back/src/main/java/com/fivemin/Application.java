package com.fivemin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class Application {

	public static void main(String[] args) {
		// 서버 종료 시 메시지
		Runtime.getRuntime().addShutdownHook(new Thread(() -> {
			System.out.println();
			System.out.println("  🚨 5MIN — 응급 서버 종료");
			System.out.println("  골든타임을 지키겠습니다. 다음에 또 만나요.");
			System.out.println();
		}));

		ConfigurableApplicationContext context = SpringApplication.run(Application.class, args);
		String port = context.getEnvironment().getProperty("server.port", "8080");

		System.out.println();
		System.out.println("  🚑 5MIN — 응급 서버 시작");
		System.out.println("  ⚡ 골든타임, 지금부터 카운트합니다.");
		System.out.println();
		System.out.println("  http://localhost:" + port + "/api/emergency");
		System.out.println();
	}
}