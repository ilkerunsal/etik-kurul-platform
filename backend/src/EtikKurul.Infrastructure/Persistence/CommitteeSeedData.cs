using EtikKurul.Infrastructure.Entities;

namespace EtikKurul.Infrastructure.Persistence;

public static class CommitteeSeedData
{
    public static readonly Committee[] All =
    [
        new()
        {
            Id = Guid.Parse("d5c5d8de-0a14-4d9f-8077-a67384f45301"),
            Code = "saglik_bilimleri",
            Name = "Saglik Bilimleri",
            Active = true,
        },
        new()
        {
            Id = Guid.Parse("67d6b9fd-8ec8-4f32-b6f7-b79d2dfd6c8a"),
            Code = "sosyal_ve_beseri",
            Name = "Sosyal ve Beseri",
            Active = true,
        },
        new()
        {
            Id = Guid.Parse("0709d5e0-17d7-4503-b00a-fcbb9bb37270"),
            Code = "hayvan_deneyleri",
            Name = "Hayvan Deneyleri",
            Active = true,
        },
        new()
        {
            Id = Guid.Parse("6b25f3f0-cd44-4d03-a2fd-a77f06e2c828"),
            Code = "kurumsal_etik",
            Name = "Kurumsal Etik",
            Active = true,
        },
    ];
}
