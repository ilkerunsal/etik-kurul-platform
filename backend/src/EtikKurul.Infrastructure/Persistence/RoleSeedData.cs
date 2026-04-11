using EtikKurul.Infrastructure.Entities;

namespace EtikKurul.Infrastructure.Persistence;

public static class RoleSeedData
{
    public static readonly Role[] All =
    [
        new() { Id = Guid.Parse("4a13f5cb-6a4e-4a6e-9578-7bd8e267dd10"), Code = "researcher", Name = "Araştırmacı" },
        new() { Id = Guid.Parse("a9aaf954-9d0f-463d-b9b1-39df7e6856bd"), Code = "principal_researcher", Name = "Sorumlu Araştırmacı" },
        new() { Id = Guid.Parse("a5d9e25d-cbae-4544-8ce7-db80b7f2d89f"), Code = "assistant_researcher", Name = "Yardımcı Araştırmacı" },
        new() { Id = Guid.Parse("01c95930-13aa-4a03-b705-0bda79324d98"), Code = "ethics_expert_candidate", Name = "Etik Uzman Adayı" },
        new() { Id = Guid.Parse("94d91920-b8d8-4e3e-8c0c-96d6d644e4d3"), Code = "ethics_expert", Name = "Etik Uzman" },
        new() { Id = Guid.Parse("0d6427bd-fa7d-42da-a312-4fe57f8caf01"), Code = "secretariat", Name = "Sekreterya" },
        new() { Id = Guid.Parse("95f204b1-5d7a-4af9-88d7-9196743ec40b"), Code = "training_manager", Name = "Eğitim Yöneticisi" },
        new() { Id = Guid.Parse("2f81440f-0ae9-45da-944c-4bc5a935a1e6"), Code = "admin", Name = "Admin" },
        new() { Id = Guid.Parse("a790c4cb-ae91-4ed2-8c07-344dcff15333"), Code = "super_admin", Name = "Super Admin" },
    ];
}
