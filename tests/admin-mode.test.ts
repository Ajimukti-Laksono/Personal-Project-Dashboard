import { describe, it, expect } from "vitest";
import { AdminConfirmModal, AdminLogoutModal, Navbar, Sidebar } from "@/components";
import { proxy } from "@/proxy";
import { NextRequest } from "next/server";

describe("Admin Mode Features & Confirmation Modals", () => {
  it("should export AdminConfirmModal and AdminLogoutModal properly", () => {
    expect(AdminConfirmModal).toBeDefined();
    expect(typeof AdminConfirmModal).toBe("function");
    expect(AdminLogoutModal).toBeDefined();
    expect(typeof AdminLogoutModal).toBe("function");
  });

  it("should export Navbar and Sidebar with admin mode capabilities", () => {
    expect(Navbar).toBeDefined();
    expect(typeof Navbar).toBe("function");
    expect(Sidebar).toBeDefined();
    expect(typeof Sidebar).toBe("function");
  });

  it("should properly protect admin endpoints from unauthenticated access via proxy", async () => {
    // Unauthenticated request to protected sync endpoint
    const req = new NextRequest("http://localhost:3000/api/sync", {
      method: "POST",
    });

    const res = await proxy(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized. Admin authentication required.");
  });

  it("should allow public endpoints through proxy", async () => {
    const req = new NextRequest("http://localhost:3000/", {
      method: "GET",
    });

    const res = await proxy(req);
    // NextResponse.next() returns a 200 header response in Next.js
    expect(res.status).toBe(200);
  });
});
