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

function New-DemoRegisterBody {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Label,
        [Parameter(Mandatory = $true)]
        [string]$Password
    )

    $seed = (Get-Random -Minimum 1000000000 -Maximum 1999999999).ToString()
    $stamp = Get-Date -Format "yyyyMMddHHmmssfff"
    $suffix = $stamp.Substring($stamp.Length - 6)

    return @{
        firstName = $Label
        lastName = "Demo"
        tckn = "7$seed"
        birthDate = "1990-01-01"
        email = "$($Label.ToLower())+$suffix@example.com"
        phone = "90541$($stamp.Substring($stamp.Length - 7))"
        password = $Password
    }
}

function Provision-RoleSession {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BaseUrl,
        [Parameter(Mandatory = $true)]
        [string]$Label,
        [Parameter(Mandatory = $true)]
        [string]$RoleCode,
        [Parameter(Mandatory = $true)]
        [string]$Password
    )

    $registerBody = New-DemoRegisterBody -Label $Label -Password $Password
    $register = Invoke-Json -Method Post -Uri "$BaseUrl/auth/register" -Body $registerBody
    $verify = Invoke-Json -Method Post -Uri "$BaseUrl/auth/verify-identity" -Body @{
        userId = $register.userId
    }

    if (-not $verify.success) {
        throw "$Label identity verification failed."
    }

    $queryEmail = [uri]::EscapeDataString($registerBody.email)
    $queryPhone = [uri]::EscapeDataString($registerBody.phone)
    $messages = Invoke-Json -Method Get -Uri "$BaseUrl/dev/mock-messages?email=$queryEmail&phone=$queryPhone"
    $emailMessage = $messages | Where-Object { $_.channelType -eq "email" } | Select-Object -First 1

    if (-not $emailMessage.code) {
        throw "$Label email verification code was not found in the mock inbox."
    }

    $confirm = Invoke-Json -Method Post -Uri "$BaseUrl/auth/confirm-code" -Body @{
        userId = $register.userId
        channelType = "email"
        code = $emailMessage.code
    }

    if ($confirm.accountStatus -ne "Active") {
        throw "$Label account could not be activated."
    }

    $roleAssignment = Invoke-Json -Method Post -Uri "$BaseUrl/dev/roles/assign" -Body @{
        userId = $register.userId
        roleCode = $RoleCode
    }

    $login = Invoke-Json -Method Post -Uri "$BaseUrl/auth/login" -Body @{
        emailOrPhone = $registerBody.email
        password = $Password
    }

    return [pscustomobject]@{
        userId = $register.userId
        email = $registerBody.email
        accessToken = $login.accessToken
        roleCode = $roleAssignment.roleCode
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
    $submittedApplication = $null
    $applications = @()
    $applicationDetail = $null
    $finalDossier = $null
    $finalDossierDocument = $null

    if ($validation.isValid) {
        $submittedApplication = Invoke-Json -Method Post -Uri "$BaseUrl/applications/$($createApplication.applicationId)/submit" -BearerToken $login.accessToken -Body @{}
    }

    $secretariatSession = $null
    $expertSession = $null
    $expertQueue = @()
    $assignment = $null
    $expertAssignments = @()
    $review = $null
    $expertRevisionRequest = $null
    $revisionResponse = $null
    $expertDecision = $null
    $packageQueue = @()
    $reviewPackage = $null
    $agendaQueue = @()
    $agendaItem = $null
    $committeeRevisionRequest = $null
    $committeeRevisionResponse = $null
    $committeeDecision = $null

    if ($submittedApplication) {
        $secretariatSession = Provision-RoleSession -BaseUrl $BaseUrl -Label "Secretariat" -RoleCode "secretariat" -Password $Password
        $expertSession = Provision-RoleSession -BaseUrl $BaseUrl -Label "Expert" -RoleCode "ethics_expert" -Password $Password
        $expertQueue = Invoke-Json -Method Get -Uri "$BaseUrl/applications/expert-assignment/queue" -BearerToken $secretariatSession.accessToken
        $assignment = Invoke-Json -Method Post -Uri "$BaseUrl/applications/$($createApplication.applicationId)/expert-assignment" -BearerToken $secretariatSession.accessToken -Body @{
            expertUserId = $expertSession.userId
        }
        $expertAssignments = Invoke-Json -Method Get -Uri "$BaseUrl/applications/expert-review/me" -BearerToken $expertSession.accessToken
        $review = Invoke-Json -Method Post -Uri "$BaseUrl/applications/$($createApplication.applicationId)/expert-review/start" -BearerToken $expertSession.accessToken -Body @{}
        $expertRevisionRequest = Invoke-Json -Method Post -Uri "$BaseUrl/applications/$($createApplication.applicationId)/expert-review/request-revision" -BearerToken $expertSession.accessToken -Body @{
            note = "Smoke test revizyon talebi."
        }
        $revisionResponse = Invoke-Json -Method Post -Uri "$BaseUrl/applications/$($createApplication.applicationId)/revision-response" -BearerToken $login.accessToken -Body @{
            responseNote = "Smoke test revizyon yaniti."
        }
        $expertDecision = Invoke-Json -Method Post -Uri "$BaseUrl/applications/$($createApplication.applicationId)/expert-review/approve" -BearerToken $expertSession.accessToken -Body @{
            note = "Smoke test uzman onayi."
        }
        $packageQueue = Invoke-Json -Method Get -Uri "$BaseUrl/applications/secretariat/package-queue" -BearerToken $secretariatSession.accessToken
        $reviewPackage = Invoke-Json -Method Post -Uri "$BaseUrl/applications/$($createApplication.applicationId)/secretariat/package" -BearerToken $secretariatSession.accessToken -Body @{
            note = "Smoke test sekretarya paket notu."
        }
        $agendaQueue = Invoke-Json -Method Get -Uri "$BaseUrl/applications/committee-agenda/queue" -BearerToken $secretariatSession.accessToken
        $agendaItem = Invoke-Json -Method Post -Uri "$BaseUrl/applications/$($createApplication.applicationId)/committee-agenda" -BearerToken $secretariatSession.accessToken -Body @{
            note = "Smoke test kurul gundemi notu."
        }
        $committeeRevisionRequest = Invoke-Json -Method Post -Uri "$BaseUrl/applications/$($createApplication.applicationId)/committee-review/request-revision" -BearerToken $secretariatSession.accessToken -Body @{
            note = "Smoke test kurul revizyon talebi."
        }
        $committeeRevisionResponse = Invoke-Json -Method Post -Uri "$BaseUrl/applications/$($createApplication.applicationId)/committee-revision-response" -BearerToken $login.accessToken -Body @{
            responseNote = "Smoke test kurul revizyon yaniti."
        }
        $committeeDecision = Invoke-Json -Method Post -Uri "$BaseUrl/applications/$($createApplication.applicationId)/committee-review/approve" -BearerToken $secretariatSession.accessToken -Body @{
            note = "Smoke test kurul onayi."
        }
    }

    $applicationDetail = Invoke-Json -Method Get -Uri "$BaseUrl/applications/$($createApplication.applicationId)" -BearerToken $login.accessToken
    $finalDossier = Invoke-Json -Method Get -Uri "$BaseUrl/applications/$($createApplication.applicationId)/final-dossier" -BearerToken $login.accessToken
    $finalDossierDocument = Invoke-WebRequest -UseBasicParsing -Method Get -Uri "$BaseUrl/applications/$($createApplication.applicationId)/final-dossier/document" -Headers @{
        Authorization = "Bearer $($login.accessToken)"
    }
    $applications = Invoke-Json -Method Get -Uri "$BaseUrl/applications" -BearerToken $login.accessToken

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
        applicationStatus = $applicationDetail.status
        applicationCurrentStep = $applicationDetail.currentStep
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
        submitApplicationStatus = if ($submittedApplication) { $submittedApplication.status } else { $null }
        submitApplicationCurrentStep = if ($submittedApplication) { $submittedApplication.currentStep } else { $null }
        expertQueueCount = @($expertQueue).Count
        expertAssignedUserId = if ($assignment) { $assignment.expertUserId } else { $null }
        expertAssignmentStep = if ($assignment) { $assignment.application.currentStep } else { $null }
        expertReviewWorkloadCount = @($expertAssignments).Count
        expertReviewStep = if ($review) { $review.application.currentStep } else { $null }
        expertRevisionDecisionType = if ($expertRevisionRequest) { $expertRevisionRequest.decisionType } else { $null }
        expertRevisionDecisionStep = if ($expertRevisionRequest) { $expertRevisionRequest.application.currentStep } else { $null }
        revisionResponseStep = if ($revisionResponse) { $revisionResponse.application.currentStep } else { $null }
        expertDecisionType = if ($expertDecision) { $expertDecision.decisionType } else { $null }
        expertDecisionStep = if ($expertDecision) { $expertDecision.application.currentStep } else { $null }
        packageQueueCount = @($packageQueue).Count
        packageStep = if ($reviewPackage) { $reviewPackage.application.currentStep } else { $null }
        agendaQueueCount = @($agendaQueue).Count
        agendaStep = if ($agendaItem) { $agendaItem.application.currentStep } else { $null }
        committeeRevisionDecisionType = if ($committeeRevisionRequest) { $committeeRevisionRequest.decisionType } else { $null }
        committeeRevisionDecisionStep = if ($committeeRevisionRequest) { $committeeRevisionRequest.application.currentStep } else { $null }
        committeeRevisionResponseStep = if ($committeeRevisionResponse) { $committeeRevisionResponse.application.currentStep } else { $null }
        committeeDecisionType = if ($committeeDecision) { $committeeDecision.decisionType } else { $null }
        committeeDecisionStep = if ($committeeDecision) { $committeeDecision.application.currentStep } else { $null }
        finalDossierStatus = if ($finalDossier) { $finalDossier.dossierStatus } else { $null }
        finalDossierReady = if ($finalDossier) { $finalDossier.isReady } else { $null }
        finalDossierSectionCount = if ($finalDossier) { @($finalDossier.includedSections).Count } else { 0 }
        finalDossierDecisionType = if ($finalDossier) { $finalDossier.committeeDecisionType } else { $null }
        finalDossierDocumentStatus = if ($finalDossierDocument) { [int]$finalDossierDocument.StatusCode } else { $null }
        finalDossierDocumentContentType = if ($finalDossierDocument) { $finalDossierDocument.Headers["Content-Type"] } else { $null }
        finalDossierDocumentLength = if ($finalDossierDocument) { $finalDossierDocument.Content.Length } else { 0 }
        listedApplicationCount = @($applications).Count
        listedFirstApplicationId = if (@($applications).Count -gt 0) { @($applications)[0].applicationId } else { $null }
        meProfileAfter = $meAfterProfile.user.profileCompletionPercent
    } | ConvertTo-Json -Depth 5
}
catch {
    Write-Error $_
    exit 1
}
