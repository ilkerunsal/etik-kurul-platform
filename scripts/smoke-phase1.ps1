param(
    [string]$BaseUrl = "http://localhost:3006/api",
    [string]$FirstName = "Ilker",
    [string]$LastName = "Test",
    [string]$Tckn = "12345678901",
    [string]$BirthDate = "1990-01-15",
    [string]$Password = "StrongPass123!"
)

$ErrorActionPreference = "Stop"

$stamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "test+$stamp@example.com"
$phone = "90532$($stamp.Substring($stamp.Length - 7))"

function Invoke-Json {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet("Get", "Post", "Put")]
        [string]$Method,
        [Parameter(Mandatory = $true)]
        [string]$Uri,
        [object]$Body,
        [string]$BearerToken
    )

    $headers = @{}
    if ($BearerToken) {
        $headers.Authorization = "Bearer $BearerToken"
    }

    if ($Method -eq "Get") {
        return Invoke-RestMethod -Method Get -Uri $Uri -Headers $headers
    }

    return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $headers -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 8)
}

function Get-StatusCode {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet("Get", "Post")]
        [string]$Method,
        [Parameter(Mandatory = $true)]
        [string]$Uri,
        [string]$BearerToken
    )

    $headers = @{}
    if ($BearerToken) {
        $headers.Authorization = "Bearer $BearerToken"
    }

    try {
        $response = Invoke-WebRequest -UseBasicParsing -Method $Method -Uri $Uri -Headers $headers
        return [int]$response.StatusCode
    }
    catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            return [int]$_.Exception.Response.StatusCode
        }

        throw
    }
}

try {
    $register = Invoke-Json -Method Post -Uri "$BaseUrl/auth/register" -Body @{
        firstName = $FirstName
        lastName = $LastName
        tckn = $Tckn
        birthDate = $BirthDate
        email = $email
        phone = $phone
        password = $Password
    }

    $verify = Invoke-Json -Method Post -Uri "$BaseUrl/auth/verify-identity" -Body @{
        userId = $register.userId
    }

    if (-not $verify.success) {
        throw "Identity verification failed with response code '$($verify.responseCode)'."
    }

    Start-Sleep -Seconds 1

    $queryEmail = [uri]::EscapeDataString($email)
    $queryPhone = [uri]::EscapeDataString($phone)
    $messages = Invoke-Json -Method Get -Uri "$BaseUrl/dev/mock-messages?email=$queryEmail&phone=$queryPhone"
    $emailMessage = $messages | Where-Object { $_.channelType -eq "email" } | Select-Object -First 1
    $smsMessage = $messages | Where-Object { $_.channelType -eq "sms" } | Select-Object -First 1

    if (-not $emailMessage.code) {
        throw "Email verification code was not found in the mock inbox."
    }

    $confirm = Invoke-Json -Method Post -Uri "$BaseUrl/auth/confirm-code" -Body @{
        userId = $register.userId
        channelType = "email"
        code = $emailMessage.code
    }

    $login = Invoke-Json -Method Post -Uri "$BaseUrl/auth/login" -Body @{
        emailOrPhone = $email
        password = $Password
    }

    $meBeforeProfile = Invoke-Json -Method Get -Uri "$BaseUrl/auth/me" -BearerToken $login.accessToken
    $accessBeforeProfile = Invoke-Json -Method Get -Uri "$BaseUrl/auth/application-access" -BearerToken $login.accessToken
    $probeBeforeProfileStatus = Get-StatusCode -Method Get -Uri "$BaseUrl/auth/application-access/probe" -BearerToken $login.accessToken
    $createApplicationBeforeProfileStatus = Get-StatusCode -Method Post -Uri "$BaseUrl/applications" -BearerToken $login.accessToken

    $profile = Invoke-Json -Method Post -Uri "$BaseUrl/profile" -BearerToken $login.accessToken -Body @{
        academicTitle = "Dr."
        degreeLevel = "Doktora"
        institutionName = "Test Universitesi"
        facultyName = "Tip Fakultesi"
        departmentName = "Klinik Arastirmalar"
        positionTitle = "Ogretim Gorevlisi"
        biography = "Smoke test profili."
        specializationSummary = "Etik kurul surecleri ve arastirma metodolojisi."
        hasESignature = $true
        kepAddress = "test@kep.example.com"
        cvDocumentId = $null
    }

    $profileUpdate = Invoke-Json -Method Put -Uri "$BaseUrl/profile/me" -BearerToken $login.accessToken -Body @{
        academicTitle = "Prof."
        degreeLevel = "Doktora"
        institutionName = "Test Universitesi"
        facultyName = "Tip Fakultesi"
        departmentName = "Klinik Arastirmalar"
        positionTitle = "Ogretim Uyesi"
        biography = "Smoke test profili guncellendi."
        specializationSummary = "Etik kurul surecleri, arastirma metodolojisi ve mevzuat."
        hasESignature = $true
        kepAddress = "test@kep.example.com"
        cvDocumentId = ([guid]::NewGuid()).Guid
    }

    $profileMe = Invoke-Json -Method Get -Uri "$BaseUrl/profile/me" -BearerToken $login.accessToken
    $meAfterProfile = Invoke-Json -Method Get -Uri "$BaseUrl/auth/me" -BearerToken $login.accessToken
    $accessAfterProfile = Invoke-Json -Method Get -Uri "$BaseUrl/auth/application-access" -BearerToken $login.accessToken
    $probeAfterProfileStatus = Get-StatusCode -Method Get -Uri "$BaseUrl/auth/application-access/probe" -BearerToken $login.accessToken
    $createApplication = Invoke-Json -Method Post -Uri "$BaseUrl/applications" -BearerToken $login.accessToken -Body @{
        title = "Smoke Basvurusu"
        summary = "Gercek applications akisi smoke testi."
    }

    $committees = Invoke-Json -Method Get -Uri "$BaseUrl/committees" -BearerToken $login.accessToken
    if (-not $committees -or @($committees).Count -eq 0) {
        throw "Committee listesi bos dondu."
    }

    $selectedCommittee = @($committees)[0]

    $entryMode = Invoke-Json -Method Post -Uri "$BaseUrl/applications/$($createApplication.applicationId)/entry-mode" -BearerToken $login.accessToken -Body @{
        entryMode = "Guided"
    }

    $intake = Invoke-Json -Method Post -Uri "$BaseUrl/applications/$($createApplication.applicationId)/intake" -BearerToken $login.accessToken -Body @{
        answers = @{
            researchArea = "clinical"
            participantCount = 12
            requiresSpecialReview = $false
        }
        suggestedCommitteeId = $selectedCommittee.committeeId
        alternativeCommittees = @($selectedCommittee.committeeId)
        confidenceScore = 0.93
        explanationText = "Smoke intake yonlendirme verisi."
    }

    $committeeSelection = Invoke-Json -Method Post -Uri "$BaseUrl/applications/$($createApplication.applicationId)/committee" -BearerToken $login.accessToken -Body @{
        committeeId = $selectedCommittee.committeeId
        committeeSelectionSource = "guided"
    }

    $form = Invoke-Json -Method Post -Uri "$BaseUrl/applications/$($createApplication.applicationId)/forms/clinical-main" -BearerToken $login.accessToken -Body @{
        versionNo = 1
        data = @{
            studyTitle = "Smoke Basvurusu"
            participantCount = 12
            method = "Prospective"
        }
        completionPercent = 100
    }

    $document = Invoke-Json -Method Post -Uri "$BaseUrl/applications/$($createApplication.applicationId)/documents" -BearerToken $login.accessToken -Body @{
        documentType = "consent_form"
        sourceType = "upload"
        originalFileName = "consent.pdf"
        storageKey = "mock://documents/consent.pdf"
        mimeType = "application/pdf"
        versionNo = 1
        isRequired = $true
    }

    $validation = Invoke-Json -Method Post -Uri "$BaseUrl/applications/$($createApplication.applicationId)/validate" -BearerToken $login.accessToken -Body @{}

    [pscustomobject]@{
        email = $email
        phone = $phone
        userId = $register.userId
        registerStatus = $register.accountStatus
        verifySuccess = $verify.success
        verifyCode = $verify.responseCode
        mockMessageCount = @($messages).Count
        emailCode = $emailMessage.code
        smsCode = $smsMessage.code
        activeStatus = $confirm.accountStatus
        loginRoleCount = @($login.user.roles).Count
        meStatus = $meBeforeProfile.user.accountStatus
        meProfileBefore = $meBeforeProfile.user.profileCompletionPercent
        accessBeforeCanOpen = $accessBeforeProfile.access.canOpenApplication
        accessBeforeReason = $accessBeforeProfile.access.reasonCode
        probeBeforeStatus = $probeBeforeProfileStatus
        createApplicationBeforeStatus = $createApplicationBeforeProfileStatus
        profileUserId = $profile.userId
        profileCompletionPercent = $profile.profileCompletionPercent
        profileUpdateAcademicTitle = $profileUpdate.academicTitle
        profileUpdateCompletionPercent = $profileUpdate.profileCompletionPercent
        profileMeAcademicTitle = $profileMe.academicTitle
        profileMeCompletionPercent = $profileMe.profileCompletionPercent
        accessAfterCanOpen = $accessAfterProfile.access.canOpenApplication
        accessAfterReason = $accessAfterProfile.access.reasonCode
        accessAfterMinimum = $accessAfterProfile.access.minimumProfileCompletionPercent
        probeAfterStatus = $probeAfterProfileStatus
        createApplicationAfterStatus = 201
        applicationId = $createApplication.applicationId
        applicationStatus = $createApplication.status
        applicationCurrentStep = $createApplication.currentStep
        committeeCount = @($committees).Count
        selectedCommitteeId = $selectedCommittee.committeeId
        entryMode = $entryMode.entryMode
        intakeSuggestedCommitteeId = $intake.suggestedCommitteeId
        committeeSelectionStep = $committeeSelection.currentStep
        formCompletionPercent = $form.completionPercent
        documentValidationStatus = $document.validationStatus
        validationIsValid = $validation.isValid
        validationCurrentStep = $validation.currentStep
        validationItemCount = @($validation.items).Count
        meProfileAfter = $meAfterProfile.user.profileCompletionPercent
    } | ConvertTo-Json -Depth 5
}
catch {
    Write-Error $_
    exit 1
}
